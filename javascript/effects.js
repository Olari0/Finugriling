String.prototype.parseColor=function(){var color="#";if("rgb("==this.slice(0,4)){var cols=this.slice(4,this.length-1).split(","),i=0;do color+=parseInt(cols[i]).toColorPart();while(++i<3)}else if("#"==this.slice(0,1)){if(4==this.length)for(var i=1;4>i;i++)color+=(this.charAt(i)+this.charAt(i)).toLowerCase();7==this.length&&(color=this.toLowerCase())}return 7==color.length?color:arguments[0]||this},Element.collectTextNodes=function(element){return $A($(element).childNodes).collect(function(node){return 3==node.nodeType?node.nodeValue:node.hasChildNodes()?Element.collectTextNodes(node):""}).flatten().join("")},Element.collectTextNodesIgnoreClass=function(element,className){return $A($(element).childNodes).collect(function(node){return 3==node.nodeType?node.nodeValue:node.hasChildNodes()&&!Element.hasClassName(node,className)?Element.collectTextNodesIgnoreClass(node,className):""}).flatten().join("")},Element.setContentZoom=function(element,percent){return element=$(element),element.setStyle({fontSize:percent/100+"em"}),Prototype.Browser.WebKit&&window.scrollBy(0,0),element},Element.getInlineOpacity=function(element){return $(element).style.opacity||""},Element.forceRerendering=function(element){try{element=$(element);var n=document.createTextNode(" ");element.appendChild(n),element.removeChild(n)}catch(e){}};var Effect={_elementDoesNotExistError:{name:"ElementDoesNotExistError",message:"The specified DOM element does not exist, but is required for this effect to operate"},Transitions:{linear:Prototype.K,sinoidal:function(pos){return-Math.cos(pos*Math.PI)/2+.5},reverse:function(pos){return 1-pos},flicker:function(pos){var pos=-Math.cos(pos*Math.PI)/4+.75+Math.random()/4;return pos>1?1:pos},wobble:function(pos){return-Math.cos(pos*Math.PI*9*pos)/2+.5},pulse:function(pos,pulses){return pulses=pulses||5,0==(pos%(1/pulses)*pulses).round()?pos*pulses*2-(pos*pulses*2).floor():1-(pos*pulses*2-(pos*pulses*2).floor())},spring:function(pos){return 1-Math.cos(4.5*pos*Math.PI)*Math.exp(6*-pos)},none:function(){return 0},full:function(){return 1}},DefaultOptions:{duration:1,fps:100,sync:!1,from:0,to:1,delay:0,queue:"parallel"},tagifyText:function(element){var tagifyStyle="position:relative";Prototype.Browser.IE&&(tagifyStyle+=";zoom:1"),element=$(element),$A(element.childNodes).each(function(child){3==child.nodeType&&(child.nodeValue.toArray().each(function(character){element.insertBefore(new Element("span",{style:tagifyStyle}).update(" "==character?String.fromCharCode(160):character),child)}),Element.remove(child))})},multiple:function(element,effect){var elements;elements=("object"==typeof element||Object.isFunction(element))&&element.length?element:$(element).childNodes;var options=Object.extend({speed:.1,delay:0},arguments[2]||{}),masterDelay=options.delay;$A(elements).each(function(element,index){new effect(element,Object.extend(options,{delay:index*options.speed+masterDelay}))})},PAIRS:{slide:["SlideDown","SlideUp"],blind:["BlindDown","BlindUp"],appear:["Appear","Fade"]},toggle:function(element,effect){element=$(element),effect=(effect||"appear").toLowerCase();var options=Object.extend({queue:{position:"end",scope:element.id||"global",limit:1}},arguments[2]||{});Effect[element.visible()?Effect.PAIRS[effect][1]:Effect.PAIRS[effect][0]](element,options)}};Effect.DefaultOptions.transition=Effect.Transitions.sinoidal,Effect.ScopedQueue=Class.create(Enumerable,{initialize:function(){this.effects=[],this.interval=null},_each:function(iterator){this.effects._each(iterator)},add:function(effect){var timestamp=(new Date).getTime(),position=Object.isString(effect.options.queue)?effect.options.queue:effect.options.queue.position;switch(position){case"front":this.effects.findAll(function(e){return"idle"==e.state}).each(function(e){e.startOn+=effect.finishOn,e.finishOn+=effect.finishOn});break;case"with-last":timestamp=this.effects.pluck("startOn").max()||timestamp;break;case"end":timestamp=this.effects.pluck("finishOn").max()||timestamp}effect.startOn+=timestamp,effect.finishOn+=timestamp,(!effect.options.queue.limit||this.effects.length<effect.options.queue.limit)&&this.effects.push(effect),this.interval||(this.interval=setInterval(this.loop.bind(this),15))},remove:function(effect){this.effects=this.effects.reject(function(e){return e==effect}),0==this.effects.length&&(clearInterval(this.interval),this.interval=null)},loop:function(){for(var timePos=(new Date).getTime(),i=0,len=this.effects.length;len>i;i++)this.effects[i]&&this.effects[i].loop(timePos)}}),Effect.Queues={instances:$H(),get:function(queueName){return Object.isString(queueName)?this.instances.get(queueName)||this.instances.set(queueName,new Effect.ScopedQueue):queueName}},Effect.Queue=Effect.Queues.get("global"),Effect.Base=Class.create({position:null,start:function(options){function codeForEvent(options,eventName){return(options[eventName+"Internal"]?"this.options."+eventName+"Internal(this);":"")+(options[eventName]?"this.options."+eventName+"(this);":"")}options&&options.transition===!1&&(options.transition=Effect.Transitions.linear),this.options=Object.extend(Object.extend({},Effect.DefaultOptions),options||{}),this.currentFrame=0,this.state="idle",this.startOn=1e3*this.options.delay,this.finishOn=this.startOn+1e3*this.options.duration,this.fromToDelta=this.options.to-this.options.from,this.totalTime=this.finishOn-this.startOn,this.totalFrames=this.options.fps*this.options.duration,eval('this.render = function(pos){ if (this.state=="idle"){this.state="running";'+codeForEvent(this.options,"beforeSetup")+(this.setup?"this.setup();":"")+codeForEvent(this.options,"afterSetup")+'};if (this.state=="running"){pos=this.options.transition(pos)*'+this.fromToDelta+"+"+this.options.from+";this.position=pos;"+codeForEvent(this.options,"beforeUpdate")+(this.update?"this.update(pos);":"")+codeForEvent(this.options,"afterUpdate")+"}}"),this.event("beforeStart"),this.options.sync||Effect.Queues.get(Object.isString(this.options.queue)?"global":this.options.queue.scope).add(this)},loop:function(timePos){if(timePos>=this.startOn){if(timePos>=this.finishOn)return this.render(1),this.cancel(),this.event("beforeFinish"),this.finish&&this.finish(),void this.event("afterFinish");var pos=(timePos-this.startOn)/this.totalTime,frame=(pos*this.totalFrames).round();frame>this.currentFrame&&(this.render(pos),this.currentFrame=frame)}},cancel:function(){this.options.sync||Effect.Queues.get(Object.isString(this.options.queue)?"global":this.options.queue.scope).remove(this),this.state="finished"},event:function(eventName){this.options[eventName+"Internal"]&&this.options[eventName+"Internal"](this),this.options[eventName]&&this.options[eventName](this)},inspect:function(){var data=$H();for(property in this)Object.isFunction(this[property])||data.set(property,this[property]);return"#<Effect:"+data.inspect()+",options:"+$H(this.options).inspect()+">"}}),Effect.Parallel=Class.create(Effect.Base,{initialize:function(effects){this.effects=effects||[],this.start(arguments[1])},update:function(position){this.effects.invoke("render",position)},finish:function(position){this.effects.each(function(effect){effect.render(1),effect.cancel(),effect.event("beforeFinish"),effect.finish&&effect.finish(position),effect.event("afterFinish")})}}),Effect.Tween=Class.create(Effect.Base,{initialize:function(object,from,to){object=Object.isString(object)?$(object):object;var args=$A(arguments),method=args.last(),options=5==args.length?args[3]:null;this.method=Object.isFunction(method)?method.bind(object):Object.isFunction(object[method])?object[method].bind(object):function(value){object[method]=value},this.start(Object.extend({from:from,to:to},options||{}))},update:function(position){this.method(position)}}),Effect.Event=Class.create(Effect.Base,{initialize:function(){this.start(Object.extend({duration:0},arguments[0]||{}))},update:Prototype.emptyFunction}),Effect.Opacity=Class.create(Effect.Base,{initialize:function(element){if(this.element=$(element),!this.element)throw Effect._elementDoesNotExistError;Prototype.Browser.IE&&!this.element.currentStyle.hasLayout&&this.element.setStyle({zoom:1});var options=Object.extend({from:this.element.getOpacity()||0,to:1},arguments[1]||{});this.start(options)},update:function(position){this.element.setOpacity(position)}}),Effect.Move=Class.create(Effect.Base,{initialize:function(element){if(this.element=$(element),!this.element)throw Effect._elementDoesNotExistError;var options=Object.extend({x:0,y:0,mode:"relative"},arguments[1]||{});this.start(options)},setup:function(){this.element.makePositioned(),this.originalLeft=parseFloat(this.element.getStyle("left")||"0"),this.originalTop=parseFloat(this.element.getStyle("top")||"0"),"absolute"==this.options.mode&&(this.options.x=this.options.x-this.originalLeft,this.options.y=this.options.y-this.originalTop)},update:function(position){this.element.setStyle({left:(this.options.x*position+this.originalLeft).round()+"px",top:(this.options.y*position+this.originalTop).round()+"px"})}}),Effect.MoveBy=function(element,toTop,toLeft){return new Effect.Move(element,Object.extend({x:toLeft,y:toTop},arguments[3]||{}))},Effect.Scale=Class.create(Effect.Base,{initialize:function(element,percent){if(this.element=$(element),!this.element)throw Effect._elementDoesNotExistError;var options=Object.extend({scaleX:!0,scaleY:!0,scaleContent:!0,scaleFromCenter:!1,scaleMode:"box",scaleFrom:100,scaleTo:percent},arguments[2]||{});this.start(options)},setup:function(){this.restoreAfterFinish=this.options.restoreAfterFinish||!1,this.elementPositioning=this.element.getStyle("position"),this.originalStyle={},["top","left","width","height","fontSize"].each(function(k){this.originalStyle[k]=this.element.style[k]}.bind(this)),this.originalTop=this.element.offsetTop,this.originalLeft=this.element.offsetLeft;var fontSize=this.element.getStyle("font-size")||"100%";["em","px","%","pt"].each(function(fontSizeType){fontSize.indexOf(fontSizeType)>0&&(this.fontSize=parseFloat(fontSize),this.fontSizeType=fontSizeType)}.bind(this)),this.factor=(this.options.scaleTo-this.options.scaleFrom)/100,this.dims=null,"box"==this.options.scaleMode&&(this.dims=[this.element.offsetHeight,this.element.offsetWidth]),/^content/.test(this.options.scaleMode)&&(this.dims=[this.element.scrollHeight,this.element.scrollWidth]),this.dims||(this.dims=[this.options.scaleMode.originalHeight,this.options.scaleMode.originalWidth])},update:function(position){var currentScale=this.options.scaleFrom/100+this.factor*position;this.options.scaleContent&&this.fontSize&&this.element.setStyle({fontSize:this.fontSize*currentScale+this.fontSizeType}),this.setDimensions(this.dims[0]*currentScale,this.dims[1]*currentScale)},finish:function(){this.restoreAfterFinish&&this.element.setStyle(this.originalStyle)},setDimensions:function(height,width){var d={};if(this.options.scaleX&&(d.width=width.round()+"px"),this.options.scaleY&&(d.height=height.round()+"px"),this.options.scaleFromCenter){var topd=(height-this.dims[0])/2,leftd=(width-this.dims[1])/2;"absolute"==this.elementPositioning?(this.options.scaleY&&(d.top=this.originalTop-topd+"px"),this.options.scaleX&&(d.left=this.originalLeft-leftd+"px")):(this.options.scaleY&&(d.top=-topd+"px"),this.options.scaleX&&(d.left=-leftd+"px"))}this.element.setStyle(d)}}),Effect.Highlight=Class.create(Effect.Base,{initialize:function(element){if(this.element=$(element),!this.element)throw Effect._elementDoesNotExistError;var options=Object.extend({startcolor:"#ffff99"},arguments[1]||{});this.start(options)},setup:function(){return"none"==this.element.getStyle("display")?void this.cancel():(this.oldStyle={},this.options.keepBackgroundImage||(this.oldStyle.backgroundImage=this.element.getStyle("background-image"),this.element.setStyle({backgroundImage:"none"})),this.options.endcolor||(this.options.endcolor=this.element.getStyle("background-color").parseColor("#ffffff")),this.options.restorecolor||(this.options.restorecolor=this.element.getStyle("background-color")),this._base=$R(0,2).map(function(i){return parseInt(this.options.startcolor.slice(2*i+1,2*i+3),16)}.bind(this)),void(this._delta=$R(0,2).map(function(i){return parseInt(this.options.endcolor.slice(2*i+1,2*i+3),16)-this._base[i]}.bind(this))))},update:function(position){this.element.setStyle({backgroundColor:$R(0,2).inject("#",function(m,v,i){return m+(this._base[i]+this._delta[i]*position).round().toColorPart()}.bind(this))})},finish:function(){this.element.setStyle(Object.extend(this.oldStyle,{backgroundColor:this.options.restorecolor}))}}),Effect.ScrollTo=function(element){var options=arguments[1]||{},scrollOffsets=document.viewport.getScrollOffsets(),elementOffsets=$(element).cumulativeOffset(),max=(window.height||document.body.scrollHeight)-document.viewport.getHeight();return options.offset&&(elementOffsets[1]+=options.offset),new Effect.Tween(null,scrollOffsets.top,elementOffsets[1]>max?max:elementOffsets[1],options,function(p){scrollTo(scrollOffsets.left,p.round())})},Effect.Fade=function(element){element=$(element);var oldOpacity=element.getInlineOpacity(),options=Object.extend({from:element.getOpacity()||1,to:0,afterFinishInternal:function(effect){0==effect.options.to&&effect.element.hide().setStyle({opacity:oldOpacity})}},arguments[1]||{});return new Effect.Opacity(element,options)},Effect.Appear=function(element){element=$(element);var options=Object.extend({from:"none"==element.getStyle("display")?0:element.getOpacity()||0,to:1,afterFinishInternal:function(effect){effect.element.forceRerendering()},beforeSetup:function(effect){effect.element.setOpacity(effect.options.from).show()}},arguments[1]||{});return new Effect.Opacity(element,options)},Effect.Puff=function(element){element=$(element);var oldStyle={opacity:element.getInlineOpacity(),position:element.getStyle("position"),top:element.style.top,left:element.style.left,width:element.style.width,height:element.style.height};return new Effect.Parallel([new Effect.Scale(element,200,{sync:!0,scaleFromCenter:!0,scaleContent:!0,restoreAfterFinish:!0}),new Effect.Opacity(element,{sync:!0,to:0})],Object.extend({duration:1,beforeSetupInternal:function(effect){Position.absolutize(effect.effects[0].element)},afterFinishInternal:function(effect){effect.effects[0].element.hide().setStyle(oldStyle)}},arguments[1]||{}))},Effect.BlindUp=function(element){return element=$(element),element.makeClipping(),new Effect.Scale(element,0,Object.extend({scaleContent:!1,scaleX:!1,restoreAfterFinish:!0,afterFinishInternal:function(effect){effect.element.hide().undoClipping()}},arguments[1]||{}))},Effect.BlindDown=function(element){element=$(element);var elementDimensions=element.getDimensions();return new Effect.Scale(element,100,Object.extend({scaleContent:!1,scaleX:!1,scaleFrom:0,scaleMode:{originalHeight:elementDimensions.height,originalWidth:elementDimensions.width},restoreAfterFinish:!0,afterSetup:function(effect){effect.element.makeClipping().setStyle({height:"0px"}).show()},afterFinishInternal:function(effect){effect.element.undoClipping()}},arguments[1]||{}))},Effect.SwitchOff=function(element){element=$(element);var oldOpacity=element.getInlineOpacity();return new Effect.Appear(element,Object.extend({duration:.4,from:0,transition:Effect.Transitions.flicker,afterFinishInternal:function(effect){new Effect.Scale(effect.element,1,{duration:.3,scaleFromCenter:!0,scaleX:!1,scaleContent:!1,restoreAfterFinish:!0,beforeSetup:function(effect){effect.element.makePositioned().makeClipping()},afterFinishInternal:function(effect){effect.element.hide().undoClipping().undoPositioned().setStyle({opacity:oldOpacity})}})}},arguments[1]||{}))},Effect.DropOut=function(element){element=$(element);var oldStyle={top:element.getStyle("top"),left:element.getStyle("left"),opacity:element.getInlineOpacity()};return new Effect.Parallel([new Effect.Move(element,{x:0,y:100,sync:!0}),new Effect.Opacity(element,{sync:!0,to:0})],Object.extend({duration:.5,beforeSetup:function(effect){effect.effects[0].element.makePositioned()},afterFinishInternal:function(effect){effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle)}},arguments[1]||{}))},Effect.Shake=function(element){element=$(element);var options=Object.extend({distance:20,duration:.5},arguments[1]||{}),distance=parseFloat(options.distance),split=parseFloat(options.duration)/10,oldStyle={top:element.getStyle("top"),left:element.getStyle("left")};return new Effect.Move(element,{x:distance,y:0,duration:split,afterFinishInternal:function(effect){new Effect.Move(effect.element,{x:2*-distance,y:0,duration:2*split,afterFinishInternal:function(effect){new Effect.Move(effect.element,{x:2*distance,y:0,duration:2*split,afterFinishInternal:function(effect){new Effect.Move(effect.element,{x:2*-distance,y:0,duration:2*split,afterFinishInternal:function(effect){new Effect.Move(effect.element,{x:2*distance,y:0,duration:2*split,afterFinishInternal:function(effect){new Effect.Move(effect.element,{x:-distance,y:0,duration:split,afterFinishInternal:function(effect){effect.element.undoPositioned().setStyle(oldStyle)}})}})}})}})}})}})},Effect.SlideDown=function(element){element=$(element).cleanWhitespace();var oldInnerBottom=element.down().getStyle("bottom"),elementDimensions=element.getDimensions();return new Effect.Scale(element,100,Object.extend({scaleContent:!1,scaleX:!1,scaleFrom:window.opera?0:1,scaleMode:{originalHeight:elementDimensions.height,originalWidth:elementDimensions.width},restoreAfterFinish:!0,afterSetup:function(effect){effect.element.makePositioned(),effect.element.down().makePositioned(),window.opera&&effect.element.setStyle({top:""}),effect.element.makeClipping().setStyle({height:"0px"}).show()},afterUpdateInternal:function(effect){effect.element.down().setStyle({bottom:effect.dims[0]-effect.element.clientHeight+"px"})},afterFinishInternal:function(effect){effect.element.undoClipping().undoPositioned(),effect.element.down().undoPositioned().setStyle({bottom:oldInnerBottom})}},arguments[1]||{}))},Effect.SlideUp=function(element){element=$(element).cleanWhitespace();var oldInnerBottom=element.down().getStyle("bottom"),elementDimensions=element.getDimensions();return new Effect.Scale(element,window.opera?0:1,Object.extend({scaleContent:!1,scaleX:!1,scaleMode:"box",scaleFrom:100,scaleMode:{originalHeight:elementDimensions.height,originalWidth:elementDimensions.width},restoreAfterFinish:!0,afterSetup:function(effect){effect.element.makePositioned(),effect.element.down().makePositioned(),window.opera&&effect.element.setStyle({top:""}),effect.element.makeClipping().show()},afterUpdateInternal:function(effect){effect.element.down().setStyle({bottom:effect.dims[0]-effect.element.clientHeight+"px"})},afterFinishInternal:function(effect){effect.element.hide().undoClipping().undoPositioned(),effect.element.down().undoPositioned().setStyle({bottom:oldInnerBottom})}},arguments[1]||{}))},Effect.Squish=function(element){return new Effect.Scale(element,window.opera?1:0,{restoreAfterFinish:!0,beforeSetup:function(effect){effect.element.makeClipping()},afterFinishInternal:function(effect){effect.element.hide().undoClipping()}})},Effect.Grow=function(element){element=$(element);var initialMoveX,initialMoveY,moveX,moveY,options=Object.extend({direction:"center",moveTransition:Effect.Transitions.sinoidal,scaleTransition:Effect.Transitions.sinoidal,opacityTransition:Effect.Transitions.full},arguments[1]||{}),oldStyle={top:element.style.top,left:element.style.left,height:element.style.height,width:element.style.width,opacity:element.getInlineOpacity()},dims=element.getDimensions();switch(options.direction){case"top-left":initialMoveX=initialMoveY=moveX=moveY=0;break;case"top-right":initialMoveX=dims.width,initialMoveY=moveY=0,moveX=-dims.width;break;case"bottom-left":initialMoveX=moveX=0,initialMoveY=dims.height,moveY=-dims.height;break;case"bottom-right":initialMoveX=dims.width,initialMoveY=dims.height,moveX=-dims.width,moveY=-dims.height;break;case"center":initialMoveX=dims.width/2,initialMoveY=dims.height/2,moveX=-dims.width/2,moveY=-dims.height/2}return new Effect.Move(element,{x:initialMoveX,y:initialMoveY,duration:.01,beforeSetup:function(effect){effect.element.hide().makeClipping().makePositioned()},afterFinishInternal:function(effect){new Effect.Parallel([new Effect.Opacity(effect.element,{sync:!0,to:1,from:0,transition:options.opacityTransition}),new Effect.Move(effect.element,{x:moveX,y:moveY,sync:!0,transition:options.moveTransition}),new Effect.Scale(effect.element,100,{scaleMode:{originalHeight:dims.height,originalWidth:dims.width},sync:!0,scaleFrom:window.opera?1:0,transition:options.scaleTransition,restoreAfterFinish:!0})],Object.extend({beforeSetup:function(effect){effect.effects[0].element.setStyle({height:"0px"}).show()},afterFinishInternal:function(effect){effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle)}},options))}})},Effect.Shrink=function(element){element=$(element);var moveX,moveY,options=Object.extend({direction:"center",moveTransition:Effect.Transitions.sinoidal,scaleTransition:Effect.Transitions.sinoidal,opacityTransition:Effect.Transitions.none},arguments[1]||{}),oldStyle={top:element.style.top,left:element.style.left,height:element.style.height,width:element.style.width,opacity:element.getInlineOpacity()},dims=element.getDimensions();switch(options.direction){case"top-left":moveX=moveY=0;break;case"top-right":moveX=dims.width,moveY=0;break;case"bottom-left":moveX=0,moveY=dims.height;break;case"bottom-right":moveX=dims.width,moveY=dims.height;break;case"center":moveX=dims.width/2,moveY=dims.height/2}return new Effect.Parallel([new Effect.Opacity(element,{sync:!0,to:0,from:1,transition:options.opacityTransition}),new Effect.Scale(element,window.opera?1:0,{sync:!0,transition:options.scaleTransition,restoreAfterFinish:!0}),new Effect.Move(element,{x:moveX,y:moveY,sync:!0,transition:options.moveTransition})],Object.extend({beforeStartInternal:function(effect){effect.effects[0].element.makePositioned().makeClipping()},afterFinishInternal:function(effect){effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle)}},options))},Effect.Pulsate=function(element){element=$(element);var options=arguments[1]||{},oldOpacity=element.getInlineOpacity(),transition=options.transition||Effect.Transitions.sinoidal,reverser=function(pos){return transition(1-Effect.Transitions.pulse(pos,options.pulses))};return reverser.bind(transition),new Effect.Opacity(element,Object.extend(Object.extend({duration:2,from:0,afterFinishInternal:function(effect){effect.element.setStyle({opacity:oldOpacity})}},options),{transition:reverser}))},Effect.Fold=function(element){element=$(element);var oldStyle={top:element.style.top,left:element.style.left,width:element.style.width,height:element.style.height};return element.makeClipping(),new Effect.Scale(element,5,Object.extend({scaleContent:!1,scaleX:!1,afterFinishInternal:function(){new Effect.Scale(element,1,{scaleContent:!1,scaleY:!1,afterFinishInternal:function(effect){effect.element.hide().undoClipping().setStyle(oldStyle)}})}},arguments[1]||{}))},Effect.Morph=Class.create(Effect.Base,{initialize:function(element){if(this.element=$(element),!this.element)throw Effect._elementDoesNotExistError;var options=Object.extend({style:{}},arguments[1]||{});if(Object.isString(options.style))if(options.style.include(":"))this.style=options.style.parseStyle();else{this.element.addClassName(options.style),this.style=$H(this.element.getStyles()),this.element.removeClassName(options.style);var css=this.element.getStyles();this.style=this.style.reject(function(style){return style.value==css[style.key]}),options.afterFinishInternal=function(effect){effect.element.addClassName(effect.options.style),effect.transforms.each(function(transform){effect.element.style[transform.style]=""})}}else this.style=$H(options.style);this.start(options)},setup:function(){function parseColor(color){return(!color||["rgba(0, 0, 0, 0)","transparent"].include(color))&&(color="#ffffff"),color=color.parseColor(),$R(0,2).map(function(i){return parseInt(color.slice(2*i+1,2*i+3),16)})}this.transforms=this.style.map(function(pair){var property=pair[0],value=pair[1],unit=null;if("#zzzzzz"!=value.parseColor("#zzzzzz"))value=value.parseColor(),unit="color";else if("opacity"==property)value=parseFloat(value),Prototype.Browser.IE&&!this.element.currentStyle.hasLayout&&this.element.setStyle({zoom:1});else if(Element.CSS_LENGTH.test(value)){var components=value.match(/^([\+\-]?[0-9\.]+)(.*)$/);value=parseFloat(components[1]),unit=3==components.length?components[2]:null}var originalValue=this.element.getStyle(property);return{style:property.camelize(),originalValue:"color"==unit?parseColor(originalValue):parseFloat(originalValue||0),targetValue:"color"==unit?parseColor(value):value,unit:unit}}.bind(this)).reject(function(transform){return transform.originalValue==transform.targetValue||"color"!=transform.unit&&(isNaN(transform.originalValue)||isNaN(transform.targetValue))})},update:function(position){for(var transform,style={},i=this.transforms.length;i--;)style[(transform=this.transforms[i]).style]="color"==transform.unit?"#"+Math.round(transform.originalValue[0]+(transform.targetValue[0]-transform.originalValue[0])*position).toColorPart()+Math.round(transform.originalValue[1]+(transform.targetValue[1]-transform.originalValue[1])*position).toColorPart()+Math.round(transform.originalValue[2]+(transform.targetValue[2]-transform.originalValue[2])*position).toColorPart():(transform.originalValue+(transform.targetValue-transform.originalValue)*position).toFixed(3)+(null===transform.unit?"":transform.unit);this.element.setStyle(style,!0)}}),Effect.Transform=Class.create({initialize:function(tracks){this.tracks=[],this.options=arguments[1]||{},this.addTracks(tracks)},addTracks:function(tracks){return tracks.each(function(track){track=$H(track);var data=track.values().first();this.tracks.push($H({ids:track.keys().first(),effect:Effect.Morph,options:{style:data}}))}.bind(this)),this},play:function(){return new Effect.Parallel(this.tracks.map(function(track){var ids=track.get("ids"),effect=track.get("effect"),options=track.get("options"),elements=[$(ids)||$$(ids)].flatten();return elements.map(function(e){return new effect(e,Object.extend({sync:!0},options))})}).flatten(),this.options)}}),Element.CSS_PROPERTIES=$w("backgroundColor backgroundPosition borderBottomColor borderBottomStyle borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth borderRightColor borderRightStyle borderRightWidth borderSpacing borderTopColor borderTopStyle borderTopWidth bottom clip color fontSize fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop markerOffset maxHeight maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft paddingRight paddingTop right textIndent top width wordSpacing zIndex"),Element.CSS_LENGTH=/^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,String.__parseStyleElement=document.createElement("div"),String.prototype.parseStyle=function(){var style,styleRules=$H();return Prototype.Browser.WebKit?style=new Element("div",{style:this}).style:(String.__parseStyleElement.innerHTML='<div style="'+this+'"></div>',style=String.__parseStyleElement.childNodes[0].style),Element.CSS_PROPERTIES.each(function(property){style[property]&&styleRules.set(property,style[property])}),Prototype.Browser.IE&&this.include("opacity")&&styleRules.set("opacity",this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]),styleRules},Element.getStyles=document.defaultView&&document.defaultView.getComputedStyle?function(element){var css=document.defaultView.getComputedStyle($(element),null);return Element.CSS_PROPERTIES.inject({},function(styles,property){return styles[property]=css[property],styles})}:function(element){element=$(element);var styles,css=element.currentStyle;return styles=Element.CSS_PROPERTIES.inject({},function(results,property){return results[property]=css[property],results}),styles.opacity||(styles.opacity=element.getOpacity()),styles},Effect.Methods={morph:function(element,style){return element=$(element),new Effect.Morph(element,Object.extend({style:style},arguments[2]||{})),element},visualEffect:function(element,effect,options){element=$(element);var s=effect.dasherize().camelize(),klass=s.charAt(0).toUpperCase()+s.substring(1);return new Effect[klass](element,options),element},highlight:function(element,options){return element=$(element),new Effect.Highlight(element,options),element}},$w("fade appear grow shrink fold blindUp blindDown slideUp slideDown pulsate shake puff squish switchOff dropOut").each(function(effect){Effect.Methods[effect]=function(element,options){return element=$(element),Effect[effect.charAt(0).toUpperCase()+effect.substring(1)](element,options),element}}),$w("getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles").each(function(f){Effect.Methods[f]=Element[f]}),Element.addMethods(Effect.Methods);