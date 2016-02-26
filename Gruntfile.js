function resolvePath(ending) {
  if (ending && ending !== '') {
    return __dirname + path.sep + ending;
  }
  return __dirname;
}

module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

  // Webpack is used to bundle all the JS into 1 dist file 

  grunt.initConfig({
    watch: {
      js: {
        files: ['src/shaders/**/*', 'src/javascripts/**/*'],
        tasks: ['pack']
      },
      less: {
        files: ['src/less/**/*'],
        tasks: ['less:main']
      }
    },
    less: {
      main: {
        options: {
          paths: ["src/less"]
        },
        files: {
          "public/css/styles.css": "src/less/styles.less"
        }
      }
    },
    webpack: {
      main: {
        devtool: 'source-map',
        entry: {
          app: "./src/javascripts/main.js"
        },
        // externals: [{
        //    react: true,
        //    lodash: true
        // }],
        output: {
          libraryTarget: 'umd',
          path: "./public/js/",
          filename: "visual-audio.js",
        },
        stats: {
          // Configure the console output
          colors: false,
          // modules: true,
          // reasons: true
        },
        resolve: {
          // root: resolvePath(''),
          // alias: {
          //  "shader": ""
          // },
          modulesDirectories: ["./src/javascripts", "./src/shaders", "./bower_components", "./node_modules"]
        },

        // stats: false disables the stats output
      }
    },
    concurrent: {
      main: {
        options: {
          logConcurrentOutput: true
        },
        tasks: ['watch:js', 'watch:less']
      }
    }
      
  });

  

  grunt.registerTask("pack", ['webpack:main']);
  grunt.registerTask("build", ['less:main', 'pack']);
  grunt.registerTask('default', ['build', 'concurrent:main']);

};

