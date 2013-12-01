(function(w){
    var socket = io.connect('/');
    socket.on('receiveMessage', function (data) {
        console.log(data);
    });
    $('#chatForm').submit(function(e){
        var editor = $(e.target).find('textarea');
        socket.emit('postMessage', { message: editor.val() });
        editor.val('');
        e.preventDefault();
    });
})(window);