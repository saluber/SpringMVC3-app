/**
 * Backbone localStorage Adapter v1.0
 * https://github.com/jeromegn/Backbone.localStorage
 */
(function(){function b(){return(((1+Math.random())*65536)|0).toString(16).substring(1)}function a(){return(b()+b()+"-"+b()+"-"+b()+"-"+b()+"-"+b()+b()+b())}Backbone.LocalStorage=window.Store=function(d){this.name=d;var c=this.localStorage().getItem(this.name);this.records=(c&&c.split(","))||[]};_.extend(Backbone.LocalStorage.prototype,{save:function(){this.localStorage().setItem(this.name,this.records.join(","))},create:function(c){if(!c.id){c.id=c.attributes[c.idAttribute]=a()}this.localStorage().setItem(this.name+"-"+c.id,JSON.stringify(c));this.records.push(c.id.toString());this.save();return c},update:function(c){this.localStorage().setItem(this.name+"-"+c.id,JSON.stringify(c));if(!_.include(this.records,c.id.toString())){this.records.push(c.id.toString())}this.save();return c},find:function(c){return JSON.parse(this.localStorage().getItem(this.name+"-"+c.id))},findAll:function(){return _(this.records).chain().map(function(c){return JSON.parse(this.localStorage().getItem(this.name+"-"+c))},this).compact().value()},destroy:function(c){this.localStorage().removeItem(this.name+"-"+c.id);this.records=_.reject(this.records,function(d){return d==c.id.toString()});this.save();return c},localStorage:function(){return localStorage}});Backbone.LocalStorage.sync=window.Store.sync=Backbone.localSync=function(h,f,e,d){if(typeof e=="function"){e={success:e,error:d}}var g;var c=f.localStorage||f.collection.localStorage;switch(h){case"read":g=f.id!=undefined?c.find(f):c.findAll();break;case"create":g=c.create(f);break;case"update":g=c.update(f);break;case"delete":g=c.destroy(f);break}if(g){e.success(g)}else{e.error("Record not found")}};Backbone.ajaxSync=Backbone.sync;Backbone.sync=Backbone.LocalStorage.sync})();