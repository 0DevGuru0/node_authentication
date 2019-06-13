module.exports = function (grunt){
  grunt.initConfig({
    jshint:{
      files:['*.js','router/*.js','model/*.js','middleware/*.js'],
      options:{
        esnext:true,
        globals:{
          jQuery:true
        }
      }
    },
    autoprefixer:{
      single_file:{
        src:'public/css/signin.css',
        dest:'public/css/signin.css'
      }
    },
    browserify:{
      client:{
        src:['app.js'],
        dest:"public/bundle.js"
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jshint'); 
  grunt.loadNpmTasks('grunt-autoprefixer'); 
  grunt.loadNpmTasks('grunt-browserify'); 
  grunt.registerTask('default',['jshint','autoprefixer','browserify']);
  

};