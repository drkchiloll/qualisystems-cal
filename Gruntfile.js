module.exports = function(grunt) {
  grunt.initConfig({
    jshint : {
      files : ['lib/*js', './*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
}
