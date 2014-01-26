module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'app/server.js',
                dest: 'app/app_modules/server.min.js'
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['app/static/js/module/app.module.js','app/static/js/module/admin.module.js'],
                dest: 'app/app_modules/built.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'concat']);

};