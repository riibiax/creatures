module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist/'],
    browserify: {
      'dist/js/scripts.min.js': ['dist/js/scripts.min.js']
    },
    watch: {
        css: {
            files: ['src/css/*.css'],
            tasks: ['copy:css'],
            options: {
                livereload: true
            }
        },
        js: {
            files: ['src/js/*.js'],
            tasks: ['uglify:scripts', 'browserify'],
            options: {
                livereload: true
            }
        },
        index: {
            files: ['src/*.html'],
            tasks: ['copy:index'],
            options: {
                livereload: true
            }
        },
        images: {
            files: ['src/img/*.*'],
            tasks: ['copy:images'],
            options: {
                livereload: true
            }
        },
    },
    copy: {
      index: {
        expand: true,
        cwd: 'src/',
        src: ['index.html'],
        dest: 'dist/'
      },
      css: {
        expand: true,
        cwd: 'src/css/',
        src: ['**'],
        dest: 'dist/css'
      },
      images: {
        expand: true,
        cwd: 'src/img/',
        src: ['**'],
        dest: 'dist/img'
      }
    },
    uglify: {
      scripts: {
          options: {
              sourceMap: true
          },
          files: {
              'dist/js/scripts.min.js': [
                  'src/js/atutil.js',
                  'src/js/Detector.js',
                  'src/js/simplexnoise.js',
                  'src/js/stats.min.js',
                  'src/js/SuperShaders.js',
                  'https://cdn.socket.io/socket.io-1.4.5.js',
                  'src/js/index.js',
                  'src/js/OrbitControls.js',
                  'src/js/ribbon.js',
              ]
          }
      }
    },
    nodemon: {
      dev: {
        script: 'server.js'
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-nodemon');

   grunt.registerTask('default', '', function() {
    var taskList = [
        'clean',
        'copy',
        'uglify',
        'browserify',
        'concurrent'
    ];
    grunt.task.run(taskList);
  });

};