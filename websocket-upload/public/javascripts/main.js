"use strict"

$(function() {
    //check for needed API
    if (!window.File || !window.File.prototype.slice || !window.FileReader)
        return $('#upload-area').html('Your Browser Doesn\'t Support The File API')

    var selectedFile
    var reader = new FileReader()
    var socket = io()

    socket.on('more-data', function(data) {
        $('#progress-bar').width(data.percent + '%')
        $('#percent').html(data.percent)
        $('#MB').html(Math.round(data.percent / 100 * selectedFile.size / 1024 / 1024))

        var chunkSize = 512 * 1024
        var offset = data.offset * chunkSize;
        var size = Math.min(chunkSize, selectedFile.size - offset)
        var slice = selectedFile.slice(offset, offset + size)
        reader.readAsArrayBuffer(slice)
    })

    socket.on('done', function() {
        $('#progress-bar').width('100%')
        $('#percent').html(100)
        $('#MB').html(Math.round(selectedFile.size / 1024 / 1024))

        alert('Upload is finished')
    })

    $('#file-box').on('change', function() {
        selectedFile = event.target.files[0]
    })

    $('#upload-button').click(function(event) {
        if (!selectedFile)
            return alert('Please select a file')

        reader.onload = function(event) {
            socket.emit('upload', { name: selectedFile.name, data: event.target.result })
        }
        socket.emit('start', { name: selectedFile.name, size: selectedFile.size })

        $('#select').addClass('hidden')
        $('#progress').removeClass('hidden')
        $('#size').html(Math.round(selectedFile.size / 1024 / 1024))
    })
})
