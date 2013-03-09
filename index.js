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
  this.writable = true

  if(!this.write) this.write = this._readerOnWrite
  if(!this.destroy) this.destroy = this._readerOnDestroy
  if(!this.end) this.end = this._readerOnEnd
}

Reader.prototype._readerOnWrite = function(data){
  //data MUST be a buffer, maybe support other data types in the future ...
  this._reader.cache.push(data)
  this.readNext()
}

//not sure what to put for these ...
Reader.prototype._readerOnEnd = function(data){
  this._reader.ended = true
}

Reader.prototype._readerOnDestroy = function(data){
  this.end()
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
      reader.cursor += count
      var data = currentBuffer.slice(oldCursor, reader.cursor)
      return data
    } else if(reader.cache[reader.cacheCursor + 1]) {
      var buffers = [currentBuffer.slice(reader.cursor)]
      var read = currentBuffer.length - reader.cursor
      var index = reader.cacheCursor

      while(true){
        if(read < count){
          var nextBuffer = reader.cache[++index]
          if(!nextBuffer) return
          if(read + nextBuffer.length < count){
            buffers.push(nextBuffer)
            read += nextBuffer.length
          } else {
            var remaining = count - read
            read += remaining
            buffers.push(nextBuffer.slice(0, remaining))
            reader.cursor = remaining
            reader.cacheCursor = index
            return Buffer.concat(buffers, read)
          }
        }
      }
    }
  }
  if(reader.ended && !endOk)
    this.emit('error', "read could not be performed on ended stream")
}
