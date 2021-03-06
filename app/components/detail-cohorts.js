import Ember from 'ember';
import DS from 'ember-data';

export default Ember.Component.extend({
  store: Ember.inject.service(),
  course: null,
  cohorts: Ember.computed.oneWay('course.cohorts'),
  isManaging: false,
  previousCohorts: [],
  classNames: ['detail-cohorts'],
  programs: function(){
    return this.get('store').find('program');
  }.property(),
  filteredPrograms: function(){
    var self = this;
    var programProxy = Ember.ObjectProxy.extend({
      hasAvailableCohorts: Ember.computed.notEmpty('availableCohorts'),
      availableCohorts: function(){
        return this.get('cohorts').filter(function(cohort){
          return (
            cohort != null &&
            !self.get('cohorts').contains(cohort)
          );
        }).sortBy('displayTitle');
      }.property('cohorts.@each')
    });

    var deferred = Ember.RSVP.defer();
    this.get('programs').then(function(programs){
      var proxiedPrograms = programs.map(function(program){
        var proxy = programProxy.create({
          content: program,
        });
        return proxy;
      }).sortBy('title');
      deferred.resolve(proxiedPrograms.sortBy('title'));
    });
    return DS.PromiseArray.create({
      promise: deferred.promise
    });

  }.property('cohorts.@each'),
  actions: {
    manage: function(){
      var self = this;
      this.get('course.cohorts').then(function(cohorts){
        self.set('previousCohorts', cohorts.toArray());
        self.set('isManaging', true);
      });
    },
    save: function(){
      var self = this;
      let course = this.get('course');
      course.get('cohorts').then(function(newCohorts){
        let oldCohorts = self.get('previousCohorts').filter(function(cohort){
          return !newCohorts.contains(cohort);
        });
        oldCohorts.forEach(function(cohort){
          cohort.get('courses').removeObject(course);
          cohort.get('programYear').then(function(programYear){
            course.get('objectives').then(function(objectives){
              objectives.forEach(function(objective){
                objective.get('parents').then(function(parents){
                  parents.forEach(function(parent){
                    parent.get('programYears').then(function(parentProgramYears){
                      if(parentProgramYears.contains(programYear)){
                        parents.removeObject(parent);
                        parent.get('children').removeObject(objective);
                        objective.save();
                        parent.save();
                      }
                    });
                  });
                });
              });
            });
          });
          cohort.save();
        });
        course.save().then(function(){
          newCohorts.save().then(function(){
            self.set('isManaging', false);
            self.set('previousCohorts', []);
          });
        });
      });
    },
    cancel: function(){
      let course = this.get('course');
      let cohorts = course.get('cohorts');
      cohorts.clear();
      cohorts.addObjects(this.get('previousCohorts'));
      this.set('isManaging', false);

    },
    add: function(cohort){
      this.get('course').get('cohorts').addObject(cohort);
    },
    remove: function(cohort){
      this.get('course').get('cohorts').removeObject(cohort);
    }
  }
});
