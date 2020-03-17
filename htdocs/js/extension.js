/*
 RCloud.extension is the root of all extension mechanisms in RCloud.

 It is designed to be used by containment: an extendable feature class
 will privately keep an RCloud.extension instance, and then implement
 init(), add(), and remove(), forwarding part of their implementation to
 RCloud.extension.

 Note: this functionality is still evolving.  More common functionality
 will get moved here over time as patterns emerge, and some extensible
 features do not use RCloud.extension yet.  These are accidents of
 history and do not read anything into them.
*/

RCloud.extension = (function() {
    return {
        filter_field: function(field, value) {
            return function(entry) {
                return entry[field] === value;
            };
        },
        create: function(options) {
            options = options || {};
            var items_ = {};
            var sections_ = {};
            var defaults_ = options.defaults ? options.defaults : {};

            if(options.sections) {
                for(var key in options.sections)
                    sections_[key] = {filter: options.sections[key].filter};
            }
            else sections_.all = {};

            function recompute_sections() {
                for(key in sections_) {
                    sections_[key].entries = _.filter(items_, function(entry) {
                        if(entry.disable)
                            return false;
                        return sections_[key].filter ? sections_[key].filter(entry) : true;
                    });
                    sections_[key].entries.sort(function(a, b) { return a.sort - b.sort; });
                }
            }

            return {
                add: function(entries) {
                    for(var key in entries)
                        items_[key] = _.extend(_.extend({key: key}, defaults_), entries[key]);
                    recompute_sections();
                    return this;
                },
                remove: function(name) {
                    delete items_[name];
                    recompute_sections();
                    return this;
                },
                disable: function(name, disable) {
                    if(items_[name]) {
                        items_[name].disable = disable;
                        recompute_sections();
                    }
                    return this;
                },
                get: function(name) {
                    return items_[name];
                },
                entries: function(name) {
                    return sections_[name].entries;
                },
                create: function(name, _) {
                    var map = {}, array = [];
                    var args = Array.prototype.slice.call(arguments, 1);
                    var entries = this.entries(name);
                    if(entries)
                        entries.forEach(function(entry) {
                            array.push(map[entry.key] = entry.create.apply(entry, args));
                        });
                    return {map: map, array: array};
                },
                sections: sections_
            };
        }
    };
})();

