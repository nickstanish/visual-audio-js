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
      build: {
        files: ['src/**/*'],
        tasks: ['build']
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
          modulesDirectories: ["./src/javascripts", "./src/shaders", "./bower_components"]
        },

        // stats: false disables the stats output
      }
    }
      
  });

  

  grunt.registerTask("build", ['webpack:main']);
  grunt.registerTask('default', ['build', 'watch:build']);
};

