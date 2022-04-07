/**
 *
 * This file is heavily based on MonoGame's implementation of their LzxDecoder attributed to Ali Scissons
 * which is derived from libmspack by Stuart Cole.
 *
 * (C) 2003-2004 Stuart Caie.
 * (C) 2011 Ali Scissons.
 * (C) 2017 James Stine.
 *
 * The LZX method was created by Johnathan Forbes and Tomi Poutanen, adapted by Microsoft Corporation.
 *
 */

/**
 * GNU LESSER GENERAL PUBLIC LICENSE version 2.1
 * LzxDecoder is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License (LGPL) version 2.1 
 */

/**
 * MICROSOFT PUBLIC LICENSE
 * This source code a derivative on LzxDecoder and is subject to the terms of the Microsoft Public License (Ms-PL). 
 *  
 * Redistribution and use in source and binary forms, with or without modification, 
 * is permitted provided that redistributions of the source code retain the above 
 * copyright notices and this file header. 
 *  
 * Additional copyright notices should be appended to the list above. 
 * 
 * For details, see <http://www.opensource.org/licenses/ms-pl.html>.
 *
 */

/**
 * I made the mistake of not including this license years ago. Big thanks to everyone involved and license has now been
 * acknowleded properly as it should have been back in 2017.
 *
 * Resources:
 *
 * cabextract/libmspack - http://http://www.cabextract.org.uk/
 * MonoGame LzxDecoder.cs - https://github.com/MonoGame/MonoGame/blob/master/MonoGame.Framework/Content/LzxDecoder.cs
 *
 */


const LITTLE_ENDIAN = 0;
const BIG_ENDIAN = 1;

class BufferReader {

    /**
     * Creates instance of Reader class.
     * @constructor
     * @param {String} filename The filename to read with the reader.
     */
    constructor(bytes, endianus = LITTLE_ENDIAN) {

        /**
         * Sets the endianness of the buffer stream
         * @private
         * @type {Number}
         */
        this._endianus = endianus;

        this.buffer = bytes;

        /**
         * Seek index for the internal buffer.
         * @private
         * @type {Number}
         */
        this._offset = 0;

        /**
         * Bit offset for bit reading.
         * @private
         * @type {Number}
         */
        this._bitOffset = 0;

        /**
         * Last debug location for logging byte locations
         * @private
         * @type {Number}
         */
        this._lastDebugLoc = 0;
    }

    /**
    * Seeks to a specific index in the buffer.
    * @public
    * @param {Number} index Sets the buffer seek index.
    * @param {Number} origin Location to seek from
    */
    seek(index, origin = this._offset) {
        const offset = this._offset;
        this._offset = Math.max(origin + Number.parseInt(index), 0);
        if (this._offset < 0 || this._offset > this.buffer.length)
            throw new Error(`Buffer seek out of bounds! ${this._offset} ${this.buffer.length}`);
        return this._offset - offset;
    }

    /**
     * Gets the seek index of the buffer.
     * @public
     * @property bytePosition
     * @return {Number} Reurns the buffer seek index.
     */
    get bytePosition() {
        return Number.parseInt(this._offset);
    }

    /**
     * Sets the seek index of the buffer.
     * @public
     * @property bytePosition
     * @param {Number} value
     */
    set bytePosition(value) {
        this._offset = value;
    }

    /**
     * Gets the current position for bit reading.
     * @public
     * @property _bitPosition
     * @returns {Number}
     */
    get bitPosition() {
        return Number.parseInt(this._bitOffset);
    }

    /**
     * Sets the bit position clamped at 16-bit frames
     * @public
     * @property bitPosition
     * @param {Number} offset
     */
    set bitPosition(offset) {
        // when rewinding, reset it back to
        if (offset < 0) offset = 16 - offset;
        // set the offset and clamp to 16-bit frame
        this._bitOffset = offset % 16;
        // get byte seek for bit ranges that wrap past 16-bit frames
        const byteSeek = ((offset - (Math.abs(offset) % 16)) / 16) * 2;
        // seek ahead for overflow on 16-bit frames
        this.seek(byteSeek);
    }

    /**
     * Get the buffer size.
     * @public
     * @property size
     * @return {Number} Returns the size of the buffer.
     */
    get size() {
        return this.buffer.length;
    }

    /**
     * Reads a specific number of bytes.
     * @public
     * @method read
     * @param {Number} count Number of bytes to read.
     * @returns {Buffer} Contents of the buffer.
     */
    read(count) {
        // read from the buffer
        const buffer = this.buffer.slice(this._offset, this._offset + count);
        // advance seek offset
        this.seek(count);
        // debug this read
        //if (this._debug_mode) this.debug();
        // return the read buffer
        return buffer;
    }

    /**
     * Reads a single byte
     * @public
     * @returns {Number}
     */
    readByte() {
        return this.readUInt();
    }

    /**
     * Reads an int8
     * @public
     * @returns {Number}
     */
    readInt() {
        return this.read(1)[0];
    }

    /**
     * Reads an uint8
     * @public
     * @returns {Number}
     */
    readUInt() {
        return this.read(1);
    }

    /**
     * Reads a uint16
     * @public
     * @returns {Number}
     */
    readUInt16() {
        const read = this.read(2);
        if (this._endianus == LITTLE_ENDIAN)
            return read.readUInt16LE();
        return read.readUInt16BE();
    }

    /**
     * Reads a uint32
     * @public
     * @returns {Number}
     */
    readUInt32() {
        const read = this.read(4);
        if (this._endianus == LITTLE_ENDIAN)
            return read.readUInt32LE();
        return read.readUInt32BE();
    }

    /**
     * Reads an int16
     * @public
     * @returns {Number}
     */
    readInt16() {
        const read = this.read(2);
        if (this._endianus == LITTLE_ENDIAN)
            return read.readInt16LE();
        return read.readInt16BE();
    }

    /**
     * Reads an int32
     * @public
     * @returns {Number}
     */
    readInt32() {
        const read = this.read(4);
        if (this._endianus == LITTLE_ENDIAN)
            return read.readInt32LE();
        return read.readInt32BE();
    }

    /**
     * Reads a float
     * @public
     * @returns {Number}
     */
    readSingle() {
        const read = this.read(4);
        if (this._endianus == LITTLE_ENDIAN)
            return read.readFloatLE();
        return read.readFloatBE();
    }

    /**
     * Reads a double
     * @public
     * @returns {Number}
     */
    readDouble() {
        const read = this.read(4);
        if (this._endianus == LITTLE_ENDIAN)
            return read.readDoubleLE();
        return read.readDoubleBE();
    }

    /**
     * Reads a string
     * @public
     * @param {Number} [count]
     * @returns {String}
     */
    readString(count = 0) {
        if (count === 0) {
            const chars = [];
            while (this.peekByte(1) != 0x0)
                chars.push(this.readString(1));
            this.seek(1);
            return chars.join('');
        }
        return this.read(count).toString();
    }

    /**
     * Peeks ahead in the buffer without actually seeking ahead.
     * @public
     * @method peek
     * @param {Number} count Number of bytes to peek.
     * @returns {Buffer} Contents of the buffer.
     */
    peek(count) {
        // read from the buffer
        const buffer = this.read(count);
        // rewind the buffer
        this.seek(-count);
        // return the buffer
        return buffer;
    }

    /**
     * Peeks a single byte
     * @public
     * @returns {Number}
     */
    peekByte() {
        return this.peekUInt();
    }

    /**
     * Peeks an int8
     * @public
     * @returns {Number}
     */
    peekInt() {
        return this.peek(1).readInt8();
    }

    /**
     * Peeks an uint8
     * @public
     * @returns {Number}
     */
    peekUInt() {
        return this.peek(1).readUInt8();
    }

    /**
     * Peeks a uint16
     * @public
     * @returns {Number}
     */
    peekUInt16() {
        if (this._endianus == LITTLE_ENDIAN)
            return this.peek(2).readUInt16LE();
        return this.peek(2).readUInt16BE();
    }

    /**
     * Peeks a uint32
     * @public
     * @returns {Number}
     */
    peekUInt32() {
        if (this._endianus == LITTLE_ENDIAN)
            return this.peek(4).readUInt32LE();
        return this.peek(4).readUInt32BE();
    }

    /**
     * Peeks an int16
     * @public
     * @returns {Number}
     */
    peekInt16() {
        if (this._endianus == LITTLE_ENDIAN)
            return this.peek(2).readInt16LE();
        return this.peek(2).readInt16BE();
    }

    /**
     * Peeks an int32
     * @public
     * @returns {Number}
     */
    peekInt32() {
        if (this._endianus == LITTLE_ENDIAN)
            return this.peek(4).readInt32LE();
        return this.peek(4).readInt32BE();
    }

    /**
     * Peeks a float
     * @public
     * @returns {Number}
     */
    peekSingle() {
        if (this._endianus == LITTLE_ENDIAN)
            return this.peek(4).readFloatLE();
        return this.peek(4).readFloatBE();
    }

    /**
     * Peeks a double
     * @public
     * @returns {Number}
     */
    peekDouble() {
        if (this._endianus == LITTLE_ENDIAN)
            return this.peek(4).readDoubleLE();
        return this.peek(4).readDoubleBE();
    }

    /**
     * Peeks a string
     * @public
     * @param {Number} [count]
     * @returns {String}
     */
    peekString(count = 0) {
        if (count === 0) {
            const bytePosition = this.bytePosition;
            const chars = [];
            while (this.peekByte(1) != 0x0)
                chars.push(this.readString(1));
            this.bytePosition = bytePosition;
            return str.join('');
        }
        return this.peek(count).toString();
    }

    /**
     * Reads a 7-bit number.
     * @public
     * @method read7BitNumber
     * @returns {Number} Returns the number read.
     */
    read7BitNumber() {
        let result = 0;
        let bitsRead = 0;
        let value;

        // loop over bits
        do {
            value = this.readByte();
            result |= (value & 0x7F) << bitsRead;
            bitsRead += 7;
        }
        while (value & 0x80);

        return result;
    }

    /**
     * Reads bits used for LZX compression.
     * @public
     * @method readLZXBits
     * @param {Number} bits
     * @returns {Number}
     */
    readLZXBits(bits) {
        // initialize values for the loop
        let bitsLeft = bits;
        let read = 0;

        // read bits in 16-bit chunks
        while (bitsLeft > 0) {
            // peek in a 16-bit value
            const peek = this.peek(2).readUInt16LE();

            // clamp bits into the 16-bit frame we have left only read in as much as we have left
            const bitsInFrame = Math.min(Math.max(bitsLeft, 0), 16 - this.bitPosition);
            // set the offset based on current position in and bit count
            const offset = 16 - this.bitPosition - bitsInFrame;

            // create mask and shift the mask up to the offset <<
            // and then shift the return back down into mask space >>
            const value = (peek & (2 ** bitsInFrame - 1 << offset)) >> offset;

            // console.info(Log.b(peek, 16, this.bitPosition, this.bitPosition + bitsInFrame));

            // remove the bits we read from what we have left
            bitsLeft -= bitsInFrame;
            // add the bits read to the bit position
            this.bitPosition += bitsInFrame;

            // assign read with the value shifted over for reading in loops
            read |= value << bitsLeft;
        }

        // return the read bits
        return read;
    }

    /**
     * Used to peek bits.
     * @public
     * @method peekLZXBits
     * @param {Number} bits
     * @returns {Number}
     */
    peekLZXBits(bits) {
        // get the current bit position to store
        let bitPosition = this.bitPosition;
        // get the current byte position to store
        let bytePosition = this.bytePosition;

        // read the bits like normal
        const read = this.readLZXBits(bits);

        // just rewind the bit position, this will also rewind bytes where needed
        this.bitPosition = bitPosition;
        // restore the byte position
        this.bytePosition = bytePosition;

        // return the peeked value
        return read;
    }

    /**
     * Reads a 16-bit integer from a LZX bitstream
     *
     * bytes are reverse as the bitstream sequences 16 bit integers stored as LSB -> MSB (bytes)
     * abc[...]xyzABCDEF as bits would be stored as:
     * [ijklmnop][abcdefgh][yzABCDEF][qrstuvwx]
     *
     * @public
     * @method readLZXInt16
     * @param {Boolean} seek
     * @returns {Number}
     */
    readLZXInt16(seek = true) {
        // read in the next two bytes worth of data
        const lsB = this.readByte();
        const msB = this.readByte();

        // rewind the seek head
        if (!seek)
            this.seek(-2);

        // set the value
        return (lsB << 8) | msB;
    }

    /**
     * Aligns to 16-bit offset.
     * @public
     * @method align
     */
    align() {
        if (this.bitPosition > 0)
            this.bitPosition += 16 - this.bitPosition;
    }
}


// LZX Constants
const MIN_MATCH = 2; // smallest allowable match length
const MAX_MATCH = 257; // largest allowable match length
const NUM_CHARS = 256; // number of uncompressed character types
const BLOCKTYPE = {
    INVALID: 0,
    VERBATIM: 1,
    ALIGNED: 2,
    UNCOMPRESSED: 3
};
const PRETREE_NUM_ELEMENTS = 20;
const ALIGNED_NUM_ELEMENTS = 8; // aligned offset tree elements
const NUM_PRIMARY_LENGTHS = 7;
const NUM_SECONDARY_LENGTHS = 249; // number of elements in length tree

// LZX Huffman Constants
const PRETREE_MAXSYMBOLS = PRETREE_NUM_ELEMENTS;
const PRETREE_TABLEBITS = 6;
const MAINTREE_MAXSYMBOLS = NUM_CHARS + 50 * 8;
const MAINTREE_TABLEBITS = 12;
const LENGTH_MAXSYMBOLS = NUM_SECONDARY_LENGTHS + 1;
const LENGTH_TABLEBITS = 12;
const ALIGNED_MAXSYMBOLS = ALIGNED_NUM_ELEMENTS;
const ALIGNED_TABLEBITS = 7;
const LENTABLE_SAFETY = 64; // table decoding overruns are allowed

/**
 * LZX Static Data Tables
 *
 * LZX uses 'position slots' to represent match offsets.  For every match,
 * a small 'position slot' number and a small offset from that slot are
 * encoded instead of one large offset.
 *
 * Lzx.position_base[] is an index to the position slot bases
 *
 * Lzx.extra_bits[] states how many bits of offset-from-base data is needed.
 */

/**
 * Used to compress and decompress LZX format buffer.
 * @class
 * @public
 */
class Lzx {

    /**
     * Creates an instance of LZX with a given window frame.
     * @constructor
     * @param {Number} window_bits
     */
    constructor(window_bits) {
        // get the window size from window bits
        this.window_size = 1 << window_bits;

        // LZX supports window sizes of 2^15 (32 KB) to 2^21 (2 MB)
        if (window_bits < 15 || window_bits > 21)
            throw new Error('Window size out of range!');

        // initialize static tables
        if (!Lzx.extra_bits.length) {
            for (let i = 0, j = 0; i <= 50; i += 2) {
                Lzx.extra_bits[i] = Lzx.extra_bits[i + 1] = j;
                if (i != 0 && j < 17)
                    j++;
            }
        }
        if (!Lzx.position_base.length) {
            for (let i = 0, j = 0; i <= 50; i++) {
                Lzx.position_base[i] = j;
                j += 1 << Lzx.extra_bits[i];
            }
        }

        console.info(`Extra Bits:`);
        console.info(JSON.stringify(Lzx.extra_bits));
        console.info(`Position Base:`);
        console.info(JSON.stringify(Lzx.position_base));

        /**
         * calculate required position slots
         *
         * window bits:     15 16 17 18 19 20 21
         * position slots:  30 32 34 36 38 42 50
         */
        const posn_slots = (window_bits == 21 ? 50 : (window_bits == 20 ? 42 : window_bits << 1));

        // repeated offsets
        this.R0 = this.R1 = this.R2 = 1;
        // set the number of main elements
        this.main_elements = NUM_CHARS + (posn_slots << 3);
        // state of header being read used for when looping over multiple blocks
        this.header_read = false;
        // set the block remaining
        this.block_remaining = 0;
        // set the default block type
        this.block_type = BLOCKTYPE.INVALID;
        // window position
        this.window_posn = 0;

        // frequently used tables
        this.pretree_table = [];
        this.pretree_len = [];
        this.aligned_table = [];
        this.aligned_len = [];
        this.length_table = [];
        this.length_len = [];
        this.maintree_table = [];
        this.maintree_len = [];

        // initialize main tree and length tree for use with delta operations
        for (let i = 0; i < MAINTREE_MAXSYMBOLS; i++)
            this.maintree_len[i] = 0;
        for (let i = 0; i < NUM_SECONDARY_LENGTHS; i++)
            this.length_len[i] = 0;

        // the decompression window
        this.win = [];
    }

    /**
     * Decompress the buffer with given frame and block size
     * @param {BufferReader} buffer
     * @param {Number} frame_size
     * @param {Number} block_size
     * @returns {Number[]}
     */
    decompress(buffer, frame_size, block_size) {

        // read header if we haven't already
        if (!this.header_read) {
            // read the intel call
            const intel = buffer.readLZXBits(1);

            console.info(`Intel: ${intel} = ${intel}`);

            // don't care about intel e8
            if (intel != 0)
                throw new Error(`Intel E8 Call found, invalid for XNB files.`);

            // the header has been read
            this.header_read = true;
        }

        // set what's left to go to the frame size
        let togo = frame_size;

        // loop over what's left of the frame
        while (togo > 0) {

            // this is a new block
            if (this.block_remaining == 0) {
                // read in the block type
                this.block_type = buffer.readLZXBits(3);

                console.info(`Blocktype: ${this.block_type} = ${this.block_type}`);

                // read 24-bit value for uncompressed bytes in this block
                const hi = buffer.readLZXBits(16);
                const lo = buffer.readLZXBits(8);
                // number of uncompressed bytes for this block left
                this.block_remaining = (hi << 8) | lo;

                console.info(`Block Remaining: ${this.block_remaining}`);

                // switch over the valid block types
                switch (this.block_type) {
                    case BLOCKTYPE.ALIGNED:
                        // aligned offset tree
                        for (let i = 0; i < 8; i++)
                            this.aligned_len[i] = buffer.readLZXBits(3);
                        // decode table for aligned tree
                        this.aligned_table = this.decodeTable(
                            ALIGNED_MAXSYMBOLS,
                            ALIGNED_TABLEBITS,
                            this.aligned_len
                        );
                    // NOTE: rest of aligned block type is the same as verbatim block type
                    case BLOCKTYPE.VERBATIM:
                        // read the first 256 elements for main tree
                        this.readLengths(buffer, this.maintree_len, 0, 256);
                        // read the rest of the elements for the main tree
                        this.readLengths(buffer, this.maintree_len, 256, this.main_elements);
                        // decode the main tree into a table
                        this.maintree_table = this.decodeTable(
                            MAINTREE_MAXSYMBOLS,
                            MAINTREE_TABLEBITS,
                            this.maintree_len
                        );
                        // read path lengths for the length tree
                        this.readLengths(buffer, this.length_len, 0, NUM_SECONDARY_LENGTHS);
                        // decode the length tree
                        this.length_table = this.decodeTable(
                            LENGTH_MAXSYMBOLS,
                            LENGTH_TABLEBITS,
                            this.length_len
                        );
                        break;
                    case BLOCKTYPE.UNCOMPRESSED:
                        // align the bit buffer to byte range
                        buffer.align();
                        // read the offsets
                        this.R0 = buffer.readInt32();
                        this.R1 = buffer.readInt32();
                        this.R2 = buffer.readInt32();
                        break;
                    default:
                        throw new Error(`Invalid Blocktype Found: ${this.block_type}`);
                        break;
                }
            }

            // iterate over the block remaining
            let this_run = this.block_remaining;

            // loop over the bytes left in the buffer to run out our output
            while ((this_run = this.block_remaining) > 0 && togo > 0) {
                // if this run is somehow higher than togo then just cap it
                if (this_run > togo)
                    this_run = togo;

                // reduce togo and block remaining by this iteration
                togo -= this_run;
                this.block_remaining -= this_run;

                // apply 2^x-1 mask
                this.window_posn &= this.window_size - 1;
                // run cannot exceed frame size
                if (this.window_posn + this_run > this.window_size)
                    throw new Error('Cannot run outside of window frame.');

                switch (this.block_type) {
                    case BLOCKTYPE.ALIGNED:
                        while (this_run > 0) {
                            // get the element of this run
                            let main_element = this.readHuffSymbol(
                                buffer,
                                this.maintree_table,
                                this.maintree_len,
                                MAINTREE_MAXSYMBOLS,
                                MAINTREE_TABLEBITS
                            );

                            // main element is an unmatched character
                            if (main_element < NUM_CHARS) {
                                this.win[this.window_posn++] = main_element;
                                this_run--;
                                continue;
                            }

                            main_element -= NUM_CHARS;

                            let length_footer;

                            let match_length = main_element & NUM_PRIMARY_LENGTHS;
                            if (match_length == NUM_PRIMARY_LENGTHS) {
                                // get the length footer
                                length_footer = this.readHuffSymbol(
                                    buffer,
                                    this.length_table,
                                    this.length_len,
                                    LENGTH_MAXSYMBOLS,
                                    LENGTH_TABLEBITS
                                );
                                // increase match length by the footer
                                match_length += length_footer;
                            }
                            match_length += MIN_MATCH;

                            let match_offset = main_element >> 3;

                            if (match_offset > 2) {
                                // not repeated offset
                                let extra = Lzx.extra_bits[match_offset];
                                match_offset = Lzx.position_base[match_offset] - 2;
                                if (extra > 3) {
                                    // verbatim and aligned bits
                                    extra -= 3;
                                    let verbatim_bits = buffer.readLZXBits(extra);
                                    match_offset += verbatim_bits << 3;
                                    let aligned_bits = this.readHuffSymbol(
                                        buffer,
                                        this.aligned_table,
                                        this.aligned_len,
                                        ALIGNED_MAXSYMBOLS,
                                        ALIGNED_TABLEBITS
                                    );
                                    match_offset += aligned_bits;
                                }
                                else if (extra == 3) {
                                    // aligned bits only
                                    match_offset += this.readHuffSymbol(
                                        buffer,
                                        this.aligned_table,
                                        this.aligned_len,
                                        ALIGNED_MAXSYMBOLS,
                                        ALIGNED_TABLEBITS
                                    );
                                }
                                else if (extra > 0)
                                    // verbatim bits only
                                    match_offset += buffer.readLZXBits(extra);
                                else
                                    match_offset = 1; // ???

                                // update repeated offset LRU queue
                                this.R2 = this.R1;
                                this.R1 = this.R0;
                                this.R0 = match_offset;
                            }
                            else if (match_offset === 0) {
                                match_offset = this.R0;
                            }
                            else if (match_offset == 1) {
                                match_offset = this.R1;
                                this.R1 = this.R0;
                                this.R0 = match_offset;
                            }
                            else {
                                match_offset = this.R2;
                                this.R2 = this.R0;
                                this.R0 = match_offset;
                            }

                            let rundest = this.window_posn;
                            let runsrc;
                            this_run -= match_length;

                            // copy any wrapped around source data
                            if (this.window_posn >= match_offset)
                                runsrc = rundest - match_offset; // no wrap
                            else {
                                runsrc = rundest + (this.window_size - match_offset);
                                let copy_length = match_offset - this.window_posn;
                                if (copy_length < match_length) {
                                    match_length -= copy_length;
                                    this.window_posn += copy_length;
                                    while (copy_length-- > 0)
                                        this.win[rundest++] = this.win[runsrc++];
                                    runsrc = 0;
                                }
                            }
                            this.window_posn += match_length;

                            // copy match data - no worrries about destination wraps
                            while (match_length-- > 0)
                                this.win[rundest++] = this.win[runsrc++];
                        }
                        break;

                    case BLOCKTYPE.VERBATIM:
                        while (this_run > 0) {
                            // get the element of this run
                            let main_element = this.readHuffSymbol(
                                buffer,
                                this.maintree_table,
                                this.maintree_len,
                                MAINTREE_MAXSYMBOLS,
                                MAINTREE_TABLEBITS
                            );

                            // main element is an unmatched character
                            if (main_element < NUM_CHARS) {
                                this.win[this.window_posn++] = main_element;
                                this_run--;
                                continue;
                            }

                            // match: NUM_CHARS + ((slot << 3) | length_header (3 bits))

                            main_element -= NUM_CHARS;

                            let length_footer;

                            let match_length = main_element & NUM_PRIMARY_LENGTHS;
                            if (match_length == NUM_PRIMARY_LENGTHS) {
                                // read the length footer
                                length_footer = this.readHuffSymbol(
                                    buffer,
                                    this.length_table,
                                    this.length_len,
                                    LENGTH_MAXSYMBOLS,
                                    LENGTH_TABLEBITS
                                );
                                match_length += length_footer;
                            }
                            match_length += MIN_MATCH;

                            let match_offset = main_element >> 3;

                            if (match_offset > 2) {
                                // not repeated offset
                                if (match_offset != 3) {
                                    let extra = Lzx.extra_bits[match_offset];
                                    let verbatim_bits = buffer.readLZXBits(extra);
                                    match_offset = Lzx.position_base[match_offset] - 2 + verbatim_bits;
                                }
                                else
                                    match_offset = 1;

                                // update repeated offset LRU queue
                                this.R2 = this.R1;
                                this.R1 = this.R0;
                                this.R0 = match_offset;
                            }
                            else if (match_offset === 0) {
                                match_offset = this.R0;
                            }
                            else if (match_offset == 1) {
                                match_offset = this.R1;
                                this.R1 = this.R0;
                                this.R0 = match_offset;
                            }
                            else {
                                match_offset = this.R2;
                                this.R2 = this.R0;
                                this.R0 = match_offset;
                            }

                            let rundest = this.window_posn;
                            let runsrc;
                            this_run -= match_length;

                            // copy any wrapped around source data
                            if (this.window_posn >= match_offset)
                                runsrc = rundest - match_offset; // no wrap
                            else {
                                runsrc = rundest + (this.window_size - match_offset);
                                let copy_length = match_offset - this.window_posn;
                                if (copy_length < match_length) {
                                    match_length -= copy_length;
                                    this.window_posn += copy_length;
                                    while (copy_length-- > 0)
                                        this.win[rundest++] = this.win[runsrc++];
                                    runsrc = 0;
                                }
                            }
                            this.window_posn += match_length;

                            // copy match data - no worrries about destination wraps
                            while (match_length-- > 0)
                                this.win[rundest++] = this.win[runsrc++];
                        }
                        break;

                    case BLOCKTYPE.UNCOMPRESSED:
                        if ((buffer.bytePosition + this_run) > block_size)
                            throw new Error('Overrun!' + block_size + ' ' + buffer.bytePosition + ' ' + this_run);
                        for (let i = 0; i < this_run; i++)
                            this.win[window_posn + i] = buffer.buffer[buffer.bytePosition + i];
                        buffer.bytePosition += this_run;
                        this.window_posn += this_run;
                        break;

                    default:
                        throw new Error('Invalid blocktype specified!');
                }
            }
        }

        // there is still more left
        if (togo != 0)
            throw new Error('EOF reached with data left to go.');

        // ensure the buffer is aligned
        buffer.align();

        // get the start window position
        const start_window_pos = ((this.window_posn == 0) ? this.window_size : this.window_posn) - frame_size;

        // return the window
        return this.win.slice(start_window_pos, start_window_pos + frame_size);
    }

    /**
     * Reads in code lengths for symbols first to last in the given table
     * The code lengths are stored in their own special LZX way.
     * @public
     * @method readLengths
     * @param {BufferReader} buffer
     * @param {Array} table
     * @param {Number} first
     * @param {Number} last
     * @returns {Array}
     */
    readLengths(buffer, table, first, last) {
        // read in the 4-bit pre-tree deltas
        for (let i = 0; i < 20; i++)
            this.pretree_len[i] = buffer.readLZXBits(4);

        // create pre-tree table from lengths
        this.pretree_table = this.decodeTable(
            PRETREE_MAXSYMBOLS,
            PRETREE_TABLEBITS,
            this.pretree_len
        );

        // loop through the lengths from first to last
        for (let i = first; i < last;) {

            // read in the huffman symbol
            let symbol = this.readHuffSymbol(
                buffer,
                this.pretree_table,
                this.pretree_len,
                PRETREE_MAXSYMBOLS,
                PRETREE_TABLEBITS
            );

            // code = 17, run of ([read 4 bits] + 4) zeros
            if (symbol == 17) {
                // read in number of zeros as a 4-bit number + 4
                let zeros = buffer.readLZXBits(4) + 4;
                // iterate over zeros counter and add them to the table
                while (zeros-- != 0)
                    table[i++] = 0;
            }
            // code = 18, run of ([read 5 bits] + 20) zeros
            else if (symbol == 18) {
                // read in number of zeros as a 5-bit number + 20
                let zeros = buffer.readLZXBits(5) + 20;
                // add the number of zeros into the table array
                while (zeros-- != 0)
                    table[i++] = 0;
            }
            // code = 19 run of ([read 1 bit] + 4) [read huffman symbol]
            else if (symbol == 19) {
                // read for how many of the same huffman symbol to repeat
                let same = buffer.readLZXBits(1) + 4;
                // read another huffman symbol
                symbol = this.readHuffSymbol(
                    buffer,
                    this.pretree_table,
                    this.pretree_len,
                    PRETREE_MAXSYMBOLS,
                    PRETREE_TABLEBITS
                );
                symbol = table[i] - symbol;
                if (symbol < 0) symbol += 17;
                while (same-- != 0)
                    table[i++] = symbol;
            }
            // code 0 -> 16, delta current length entry
            else {
                symbol = table[i] - symbol;
                if (symbol < 0) symbol += 17;
                table[i++] = symbol;
            }
        }

        // return the table created
        return table;
    }

    /**
     * Build a decode table from a canonical huffman lengths table
     * @public
     * @method makeDecodeTable
     * @param {Number} symbols Total number of symbols in tree.
     * @param {Number} bits Any symbols less than this can be decoded in one lookup of table.
     * @param {Number[]} length Table for lengths of given table to decode.
     * @returns {Number[]} Decoded table, length should be ((1<<nbits) + (nsyms*2))
     */
    decodeTable(symbols, bits, length) {
        // decoded table to act on and return
        let table = [];

        let pos = 0;
        let table_mask = 1 << bits;
        let bit_mask = table_mask >> 1;

        // loop across all bit positions
        for (let bit_num = 1; bit_num <= bits; bit_num++) {
            // loop over the symbols we're decoding
            for (let symbol = 0; symbol < symbols; symbol++) {
                // if the symbol isn't in this iteration of length then just ignore
                if (length[symbol] == bit_num) {
                    let leaf = pos;
                    // if the position has gone past the table mask then we're overrun
                    if ((pos += bit_mask) > table_mask) {
                        console.info(length[symbol]);
                        console.info(`pos: ${pos}, bit_mask: ${bit_mask}, table_mask: ${table_mask}`);
                        console.info(`bit_num: ${bit_num}, bits: ${bits}`);
                        console.info(`symbol: ${symbol}, symbols: ${symbols}`);
                        throw new Error('Overrun table!');
                    }
                    // fill all possible lookups of this symbol with the symbol itself
                    let fill = bit_mask;
                    while (fill-- > 0)
                        table[leaf++] = symbol;
                }
            }
            // advance bit mask down the bit positions
            bit_mask >>= 1;
        }

        // exit with success if table is complete
        if (pos == table_mask)
            return table;

        // mark all remaining table entries as unused
        for (let symbol = pos; symbol < table_mask; symbol++)
            table[symbol] = 0xFFFF;

        // next_symbol = base of allocation for long codes
        let next_symbol = ((table_mask >> 1) < symbols) ? symbols : (table_mask >> 1);

        // allocate space for 16-bit values
        pos <<= 16;
        table_mask <<= 16;
        bit_mask = 1 << 15;

        // loop again over the bits
        for (let bit_num = bits + 1; bit_num <= 16; bit_num++) {
            // loop over the symbol range
            for (let symbol = 0; symbol < symbols; symbol++) {
                // if the current length iteration doesn't mach our bit then just ignore
                if (length[symbol] != bit_num)
                    continue;

                // get leaf shifted away from 16 bit padding
                let leaf = pos >> 16;

                // loop over fill to flood table with
                for (let fill = 0; fill < (bit_num - bits); fill++) {
                    // if this path hasn't been taken yet, 'allocate' two entries
                    if (table[leaf] == 0xFFFF) {
                        table[(next_symbol << 1)] = 0xFFFF;
                        table[(next_symbol << 1) + 1] = 0xFFFF;
                        table[leaf] = next_symbol++;
                    }

                    // follow the path and select either left or right for the next bit
                    leaf = table[leaf] << 1;
                    if ((pos >> (15 - fill)) & 1)
                        leaf++;
                }
                table[leaf] = symbol

                // bit position has overun the table mask
                if ((pos += bit_mask) > table_mask)
                    throw new Error('Overrun table during decoding.');
            }
            bit_mask >>= 1;
        }

        // we have reached table mask
        if (pos == table_mask)
            return table;

        // something else went wrong
        throw new Error('Decode table did not reach table mask.');
    }

    /**
     * Decodes the next huffman symbol from the bitstream.
     * @public
     * @method readHuffSymbol
     * @param {BufferReader} buffer
     * @param {Number[]} table
     * @param {Number[]} length
     * @param {Number} symbols
     * @param {Number} bits
     * @returns {Number}
     */
    readHuffSymbol(buffer, table, length, symbols, bits) {
        // peek the specified bits ahead
        let bit = (buffer.peekLZXBits(32) >>> 0); // (>>> 0) allows us to get a 32-bit uint
        let i = table[buffer.peekLZXBits(bits)];

        // if our table is accessing a symbol beyond our range
        if (i >= symbols) {
            let j = 1 << (32 - bits);
            do {
                j >>= 1;
                i <<= 1;
                i |= (bit & j) != 0 ? 1 : 0;
                if (j == 0)
                    return 0;
            }
            while ((i = table[i]) >= symbols)
        }

        // seek past this many bits
        buffer.bitPosition += length[i];

        // return the symbol
        return i;
    }

    /**
     * Sets the shortest match.
     * @param {Number} X
     */
    set RRR(X) {
        // No match, R2 <- R1, R1 <- R0, R0 <- X
        if (this.R0 != X && this.R1 != X && this.R2 != X) {
            // shift all offsets down
            this.R2 = this.R1;
            this.R1 = this.R0;
            this.R0 = X;
        }
        // X = R1, Swap R0 <-> R1
        else if (this.R1 == X) {
            let R1 = this.R1;
            this.R1 = this.R0;
            this.R0 = R1;
        }
        // X = R2, Swap R0 <-> R2
        else if (this.R2 == X) {
            let R2 = this.R2;
            this.R2 = this.R0;
            this.R0 = R2;
        }
    }
}

Lzx.position_base = [];
Lzx.extra_bits = [];

/**
 * Used to compress and decompress LZX.
 * @class
 * @public
 */
 class Presser {

    /**
     * Decompress a certain amount of bytes.
     * @public
     * @static
     * @param {BufferReader} buffer
     * @returns {Buffer}
     */
    static decompress(buffer, compressedTodo, decompressedTodo) {
        // current index into the buffer
        let pos = 0;

        // allocate variables for block and frame size
        let block_size;
        let frame_size;

        // create the LZX instance with 16-bit window frame
        const lzx = new Lzx(16);

        // the full decompressed array
        let decompressed = [];
        let z = 0;

        // loop over the bytes left
        while (pos < compressedTodo) {
            // flag is for determining if frame_size is fixed or not
            const flag = buffer.readByte();

            // if flag is set to 0xFF that means we will read in frame size
            if (flag == 0xFF) {
                // read in the frame size
                frame_size = buffer.readLZXInt16();
                // read in the block size
                block_size = buffer.readLZXInt16();
                // advance the byte position forward
                pos += 5;
            }
            else {
                // rewind the buffer
                buffer.seek(-1);
                // read in the block size
                block_size = buffer.readLZXInt16(this.buffer);
                // set the frame size
                frame_size = 0x8000;
                // advance byte position forward
                pos += 2;
            }

            // ensure the block and frame size aren't empty
            if (block_size == 0 || frame_size == 0)
                break;

            // ensure the block and frame size don't exceed size of integers
            if (block_size > 0x10000 || frame_size > 0x10000)
                throw new XnbError('Invalid size read in compression content.');

            console.info(`Block Size: ${block_size}, Frame Size: ${frame_size}`);

            // decompress the file based on frame and block size
            decompressed = decompressed.concat(lzx.decompress(buffer, frame_size, block_size));

            // increase position counter
            pos += block_size;
        }

        // we have finished decompressing the file
        console.info('File has been successfully decompressed!');

        // return a decompressed buffer
        return decompressed;
    }
}
