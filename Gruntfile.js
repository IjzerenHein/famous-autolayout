/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    eslint: {
      target: ['src/**/*.js'],
      options: {
        config: '.eslintrc'
      }
    },
    jscs: {
        src: ['src/**/*.js'],
        options: {
            config: '.jscsrc'
        }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-jscs');

  // Tasks
  grunt.registerTask('lint', ['eslint', 'jscs']);
  grunt.registerTask('default', ['lint']);
};
