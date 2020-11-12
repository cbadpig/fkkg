/**
 * TimeTo jQuery plug-in
 * Show countdown timer or realtime clock
 * @author chengxh
 * @version 2.15.12.01
 * @date 2015-12-01
 */
'use strict';
(function(factory) {
    if (typeof exports === 'object') {
        // CommonJS (Node)
        var jQuery = require('jquery');
        module.exports = factory(jQuery || $);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else {
        // globals
        factory(jQuery || $);
    }
})(function($){
	
	function dialogs(s){
		var dialogBox = dialog({
		      // 设置遮罩背景颜色
		      backdropBackground: 'grey',
		      // 设置遮罩透明度
		      backdropOpacity: 0.8,
		      innerHTML:$('#dialog').html(),
		      content:"【距离结束时间还有"+ s +"分钟】",
		      okValue:'返回作答',
	          ok:function(){}
		      
		    });
		    dialogBox.showModal(); 
		    setTimeout(function(){
		    	dialogBox.close().remove();
		    },10*1000);
	}

	var count = 0;
	
    var methods = {

        init:function($this) {
            $this.data("sysnc",2);
            $this.data("ss",999);
            $this.data("timeType","cur");
            $this.data("fun",null);
            $this.data("s_data",null);
        },

        start:function($this) {
            var data = $this.data();
            this.update($this);
            if($this.data().ss>=0){
            	var intervalId = setInterval(function(){methods.update($this)},1000);
            	$this.data("intervalId",intervalId);
            }
        },
        getTime:function($this){
            var data = $this.data(),ss=data.ss,tt=Math.round(ss/1000),sysnc = data.sysnc;
            var timeType=$this.data().timeType;
            if((timeType=='cur'||timeType=='curAll')&&(ss==-999||tt%sysnc==0)&&ss!=0){
            	$.ajax({
            		url:OBT.storage.getSession("basepath")+'/exam/ccKs/curTime.do',
            		type:'post',
            		dataType:'json',
            		async:false,
            		success:function(data) {
            			if(data.status==1) {
            				$this.data("ss",parseInt(data.message));
            			} else if(data.status==-41) {
            				var url=OBT.storage.getSession("basepath")+'/exam';
            				window.location.replace(url);
            			}  else  {
            				$this.data("ss",-999);
            			}
            		},
            		error:function(req, data, error){
            			if(req.status==401) {
            				var url=OBT.storage.getSession("basepath")+'/exam';
            				window.location.replace(url);
            			}
            			$this.data("ss",-999);
            		}
            	});
            } else if((timeType=='ksToStart')&&ss!=0) {
            	this.staticTime(1);
            } else if((timeType=='kmToEnd')&&ss!=0) {
            	this.staticTime(2);
            }
        },
        update:function($this){
            this.getTime($this);
            var ss = OBT.storage.getSession("sss");
            
        	this.format($this);
        	this.createHtml($this);
            if(ss<=0&&ss!=-999) {
            	clearInterval($this.data().intervalId);
            	this.endTime($this);
            }
            if((ss==900)&&($this.data().timeType=='kmToEnd')) {
            	dialogs(15);
            }
        },
        createHtml:function($this) {
            var data = $this.data(),timeType=data.timeType,ss=OBT.storage.getSession("sss"),s_data=data.s_data;
            if(ss<0) {
            	return ;
            }
            if(timeType=='cur') {
                //格式为：12:00:00
                $this.html(s_data.hours+":"+s_data.minutes+":"+s_data.seconds);
                $this.data('ss',ss+1000);
            } else if(timeType=='curAll') {
                //格式为：2015年12月07 12:00:00
                $this.html(s_data.year+"-"+s_data.month+"-"+ s_data.day+" " +s_data.hours+":"+s_data.minutes+":"+s_data.seconds);
                $this.data('ss',ss+1000);
            } else {
            	if(parseInt(s_data.days)>0){
            		//格式为：12天12时00分00
            		$this.html(s_data.days+"天"+s_data.hours+"时"+s_data.minutes+"分"+s_data.seconds);
            	} else {
            		//格式为：12:00:00
            		$this.html(s_data.hours+":"+s_data.minutes+":"+s_data.seconds);
            	}
                //$this.data('ss',ss-1);
            	this.staticTime(-1);
            }
        },
        format:function($this) {
            var data = $this.data(),timeType = data.timeType,ss = OBT.storage.getSession("sss");
            
            var s_data = 0;
            if(timeType=='cur'||timeType=='curAll'){
                var _date = new Date(ss);
                s_data = {
                    seconds:_date.getSeconds(),
                    minutes:_date.getMinutes(),
                    hours:_date.getHours(),
                    day:_date.getDate(),
                    month:_date.getMonth()+1,
                    year:_date.getFullYear()
                };
            } else  {
                s_data = {
                    seconds:Math.floor(ss%60),
                    minutes:Math.floor((ss/60)%60),
                    hours:Math.floor((ss/3600)%24),
                    days:Math.floor(ss/86400)
                };
            }

            for(var p in s_data){
                if(s_data[p]<10){
                    s_data[p] = "0"+s_data[p];
                }
            }

            $this.data("s_data",s_data);
        },
        endTime:function($this) {
            $this.data().fun.call();
        },
        staticTime:function(type) {
			count++;
            if(count == 122){
                if(document.getElementById("check").checked == false){
                    $(".dialogBox").css("display", "block");
                }
            }
            if(count == 242){
                if(document.getElementById("check").checked == false){
                    if($(".dialogBox").css("display") == "none"){
                        $(".dialogBox").css("display", "block");
                    }
                }
            }
        	var sss = OBT.storage.getSession("sss");
    		if(type==1&&!sss) {
    			OBT.storage.setSession("sss",2*60);
        	} else if(type==-1&&sss) {
        		console.log(type);
        		OBT.storage.setSession("sss",sss-1);
        	}
        }
    };


    $.fn.timeTo = function(){

        if(arguments.length==0||arguments[0]=='cur') {
            methods.init(this);
            this.data("timeType",'cur');
            methods.start(this);
        }else if(arguments[0]=='curAll') {
            methods.init(this);
            this.data("timeType",'curAll');
            methods.start(this);
        } else if(typeof arguments[0]==='string'&&typeof arguments[1]=='function') {
            methods.init(this);
            this.data("timeType",arguments[0]);
            this.data("fun",arguments[1]);
            methods.start(this);
        } else if(arguments[0]=='stop') {
            if(this.data().intervalId) clearInterval(this.data().intervalId);
        }

    }


});