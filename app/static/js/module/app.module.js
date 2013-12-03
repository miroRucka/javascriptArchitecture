var chatApp = angular.module('chat-app', ['data.service', 'chat.editor.module', 'chat.messages.module']);
chatApp.run(function () {
    console.log('start apllication');
});
