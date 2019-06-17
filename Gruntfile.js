'use strict';

/**
 * Gruntfile for building & deploying the API project
 */

var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
  var branch = grunt.option('branch') || 'develop',
    buildCounter = grunt.option('buildCounter') || 0;

  /**
   * Cancel the whole thing and display error message
   */
  function cancelBuild(err) {
    grunt.fail.fatal(err);
  }

  // Set a parameter (environment variable) in TeamCity
  function setTeamCityParameter(name, val) {
    grunt.log.writeln(
      "##teamcity[setParameter name='" + name + "' value='" + val + "']"
    );
  }

  // Send a service message to TeamCity
  function setTeamCityServiceMessage(name, val) {
    grunt.log.writeln('##teamcity[' + name + " '" + val + "']");
  }

  function generatePublishProfile(opts) {
    var profilePath = grunt.config('app.publishProfile'),
      xmlStr =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">' +
        '<PropertyGroup>' +
        '<WebPublishMethod>FileSystem</WebPublishMethod>' +
        '<LastUsedBuildConfiguration>' +
        opts.configuration +
        '</LastUsedBuildConfiguration>' +
        '<LastUsedPlatform>Any CPU</LastUsedPlatform>' +
        '<SiteUrlToLaunchAfterPublish />' +
        '<LaunchSiteAfterPublish>False</LaunchSiteAfterPublish>' +
        '<ExcludeApp_Data>False</ExcludeApp_Data>' +
        '<publishUrl>' +
        opts.publishUrl +
        '</publishUrl>' +
        '<DeleteExistingFiles>False</DeleteExistingFiles>' +
        '</PropertyGroup>' +
        '</Project>';

    grunt.file.write(profilePath, xmlStr);

    return {
      xmlStr: xmlStr,
      profilePath: profilePath,
    };
  }

  // Indicates this is being run from TeamCity.  Used in some places to produce different output.
  var isTeamCity = grunt.option('tc');
  grunt.log.writeln('Being run from TeamCity: ' + isTeamCity);

  // Where the build will output to
  var buildOutputFolder = grunt.option('output') || '';
  grunt.log.writeln('Build will output to folder: ' + buildOutputFolder);

  // IIS site target for deployment (only required for manual override tests)
  var iisSiteName = grunt.option('iisSiteName');
  grunt.log.writeln('IIS site supplied over the command line: ' + iisSiteName);

  // If an IIS site name was not supplied over the command line, set it to one of the pre-defined
  // names based on the Staging flag.
  if (!iisSiteName || !iisSiteName.length) {
    iisSiteName = 'API';
  }

  grunt.log.writeln('IIS site target for deployment: ' + iisSiteName);

  // child app in IIS where the app is deployed into
  var iisChildApp = grunt.option('iisChildApp');
  grunt.log.writeln(
    'IIS site child app supplied over the command line: ' + iisChildApp
  );

  if (!iisChildApp || !iisChildApp.length) {
    iisChildApp = 'mock';
  }

  grunt.log.writeln('IIS site child app target for deployment: ' + iisChildApp);

  /**
   * Task configurations
   */
  grunt.initConfig({
    // Build settings
    app: {
      versions: '1.0.0.0',
      branch: branch,
      buildCounter: buildCounter,
      buildConfiguration: 'Release',
      buildTargets: grunt.option('buildTargets') || 'Build',
      packagesConfig: grunt.option('packagesConfig') || '**/packages.config',
      packagesBin: grunt.option('packagesBin') || 'packages',
      dist: buildOutputFolder,
      publishProfile: '.tmp/PublishProfiles/Profile.pubxml',
    },

    // Deploy settings
    deployment: {
      server: grunt.option('server'),
      username: grunt.option('username'),
      password: grunt.option('password'),
      iisSiteName: iisSiteName,
      iisChildApp: iisChildApp,
    },

    // Deletes files & folders
    clean: {
      dist: [
        '<%= app.dist %>/**/*',
        '!<%= app.dist %>/.gitignore',
        '<%= app.nuget.packDestination %>',
      ],
      tmp: ['.tmp'],
    },

    // MS Deploy tasks for deploying to a remote server
    msdeploy: {
      dist: {
        options: {
          verb: 'sync',
          allowUntrusted: 'true',
          source: {
            contentPath: path.resolve('<%= app.dist %>'),
          },
          dest: {
            contentPath:
              '<%= deployment.iisSiteName %>/<%= deployment.iisChildApp %>',
            ComputerName:
              'https://<%= deployment.server %>:8172/msdeploy.axd?site=<%= deployment.iisSiteName %>',
            UserName: '<%= deployment.username %>',
            Password: '<%= deployment.password %>',
            AuthType: 'basic',
          },
        },
      },
    },
  });

  // Loads all Grunt npm tasks so you don't have to declare them all manually
  require('load-grunt-tasks')(grunt);

  /**
   * Task definitions
   */

  // Send the build version to TeamCity
  grunt.registerTask('updateTeamCityBuildVersion', function() {
    setTeamCityParameter('build.semVer', grunt.config('app.versions.semver'));
    return;
  });

  // Send the build number to TeamCity
  grunt.registerTask('updateTeamCityBuildNumber', function() {
    var branch = grunt.config('app.branch'),
      semver = grunt.config('app.versions.semver'),
      patch = grunt.config('app.versions.patch');

    if (branch === 'master') {
      setTeamCityServiceMessage('buildNumber', semver + '.' + patch);
    } else {
      setTeamCityServiceMessage('buildNumber', semver);
    }
    return;
  });

  grunt.registerTask('deploy', function() {
    if (isTeamCity) {
      grunt.task.run(['publishProfile', 'msdeploy']);
    }
  });

  // Generate a temporary publish profile to be used by MSBuild
  // Note: This is *not* added to the project like a regular Publish Profile
  grunt.registerTask('publishProfile', function() {
    var profile = generatePublishProfile({
      publishUrl: path.resolve(grunt.config('app.dist')),
      configuration: grunt.config('app.buildConfiguration'),
    });

    grunt.log.writeln('Publish profile created: ');
    grunt.log.write(JSON.stringify(profile, null, '  '));
  });

  // Helper task to log all custom settings being used
  grunt.registerTask('logSettings', function() {
    grunt.log.writeln('Build settings: ');
    grunt.log.write(JSON.stringify(grunt.config('app'), null, '  '));
  });
};
