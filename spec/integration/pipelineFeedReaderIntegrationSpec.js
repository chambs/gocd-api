
var _ = require('lodash');
var mockery = require('mockery');

describe('pipelineFeedReader', function () {

  var gocdRequestor;
  var thePipelineFeedReader;

  beforeEach(function() {

    mockery.enable({
      warnOnUnregistered: false,
      warnOnReplace: false
    });

    var globalOptions = {
      getGocdRequestor: function() {
        return gocdRequestor;
      },
      addCredentialsToUrl : function(url) {
        if(url === undefined) return '';
        var urlNoHttp = url.indexOf('http') === 0 ? url.substr('http://'.length) : url;
        return 'http://admin:wa8jah@' + urlNoHttp;
      },
      get: function() {
        return {
          url: process.env.GOCD_URL,
          pipeline: process.env.GOCD_PIPELINE || 'artwise',
          debug: true
        };
      }
    };

    mockery.registerMock('../options', globalOptions);
    mockery.registerMock('./options', globalOptions);

    require('../../lib/logger');
    gocdRequestor = require('../../lib/gocd/gocdRequestor');
    thePipelineFeedReader = require('../../lib/gocd/pipelineFeedReader');

    // Set long timeout to allow collecting all data, even with slow responses
    jasmine.getEnv().defaultTimeoutInterval = 60000;

  });

  function getFirstResult(results) {
    var buildNumbers = _.keys(results);
    return results[buildNumbers[0]];
  }

  describe('readHistory()', function () {

    it('should initialise a set of pipeline runs', function (done) {
      thePipelineFeedReader.readPipelineRuns().then(function (results) {

        expect(_.keys(results).length).toBeGreaterThan(0);

        var firstResult = getFirstResult(results);

        expect(firstResult.stages.length).toBeGreaterThan(1);

        expect(firstResult.stages[0].state).toBeDefined();

        expect(firstResult.updated).toBeDefined();
        expect(_.contains(['Passed', 'Failed'], firstResult.result)).toBe(true);
        expect(firstResult.author).toBeDefined();
        expect(firstResult.author.name).toBeDefined();

        expect(firstResult.materials.length).toBeGreaterThan(0);
        expect(firstResult.materials[0].committer).toBeDefined();
        expect(firstResult.materials[0].comment).toBeDefined();
        expect(firstResult.materials[0].sha).toBeDefined();
        expect(firstResult.info).toBeDefined();

        done();
      });

    });

  });
});