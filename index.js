require('mkstream')(Reader)

module.exports = Reader

function Reader(){
  this.initReader()
}

Reader.prototype.initReader = function(){
  this._reader = {
    cache: []
    , cursor: 0
    , cacheCursor: 0
    , ended: false
  }

  if(!this.write) this.write = this._readerOnWrite
}

Reader.prototype._onReaderWrite = function(data){
  //data MUST be a buffer, maybe support other data types in the future ...
  this._reader.cache.push(data)
  this.readNext()
}

//should be overridden, tells the reader there is more data to be read
Reader.prototype.readNext = function(){}

Reader.prototype.read = function(count, endOk){
  var reader = this._reader
  var oldCursor = reader.cursor
  var currentBuffer = reader.cache[reader.cacheCursor]
  if(currentBuffer){
    var readEnd = reader.cursor + count
    if(readEnd <= currentBuffer.length){
      this._reader.cursor += count
      var data = currentBuffer.slice(oldCursor, reader.cursor)
      return data
    } else if(this.cache[this.cacheCursor + 1]) {
      var oldCacheCursor = this.cacheCursor
      var oldBuffer = currentBuffer.slice(this.cursor)

      this.cursor = 0
      this.cacheCursor += 1

      //let's hope this recurses safely
      var nextBuffer = this.read(count - oldBuffer.length, endOk)
      if(nextBuffer){
        var data = combineBuffers(oldBuffer, nextBuffer)
        return data
      } else {
        this.cursor = oldCursor
        this.cacheCursor = oldCacheCursor
      }
    }
  }
  if(this.ended && !endOk)
    this.emit('error', "read could not be performed on ended stream")
}

function combineBuffers(buf1, buf2){
  return Buffer.concat([buf1, buf2], buf1.length + buf2.length)
}
