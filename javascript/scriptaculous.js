var Scriptaculous={Version:"1.8.1",require:function(libraryName){document.write('<script type="text/javascript" src="'+libraryName+'"></script>')},REQUIRED_PROTOTYPE:"1.6.0",load:function(){function convertVersionString(versionString){var r=versionString.split(".");return 1e5*parseInt(r[0])+1e3*parseInt(r[1])+parseInt(r[2])}if("undefined"==typeof Prototype||"undefined"==typeof Element||"undefined"==typeof Element.Methods||convertVersionString(Prototype.Version)<convertVersionString(Scriptaculous.REQUIRED_PROTOTYPE))throw"script.aculo.us requires the Prototype JavaScript framework >= "+Scriptaculous.REQUIRED_PROTOTYPE;$A(document.getElementsByTagName("script")).findAll(function(s){return s.src&&s.src.match(/scriptaculous\.js(\?.*)?$/)}).each(function(s){var path=s.src.replace(/scriptaculous\.js(\?.*)?$/,""),includes=s.src.match(/\?.*load=([a-z,]*)/);(includes?includes[1]:"builder,effects,dragdrop,controls,slider,sound").split(",").each(function(include){Scriptaculous.require(path+include+".js")})})}};Scriptaculous.load();