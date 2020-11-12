;//全局变量
var _startTimeKey = 'stime';
var _endTimeKey = 'etime';
if (!window.console) {
	  window.console = window.console || (function() {
	    var c = {};
	    c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function() {};
	    return c;
	  })();
	}
function getsto(t){
	if((navigator.userAgent.indexOf('MSIE')>=0) && (navigator.userAgent.indexOf('opera')<0)){
		var x1 =document.getElementById("webocx");
		if(t == 1){
			x1.imes;
		}else if(t == 2){
			x1.MEnableKeyboard();
		}else if(t == 3){
			x1.MDisableKeyboard();
		}else{
			x1.ShowCalc();
		}
	}
}
function showimes()
{
	getsto(1);
}
function enablekey()
{
	getsto(2);
}
function disenablekey()
{
	getsto(3);
}
function showcalc()
{
	getsto(4);
}
 function smmctk(c){
	 	if('' == c){c = '请输入解锁密码:';}
		dialog({
		  	id:'mmdialogid',
			title:'解锁密码',
			content:c+'<br><br><input autofocus id="ksdkjsmm"/>',
			okValue:'确认',
			ok:function(){
				var ccm = $("#ksdkjsmm").val();
				if('' == ccm){
					top._dialog("请输入解锁密码");
					return false;
				}
			$.ajax({
				type:"POST",
				dataType:"json",
				data:{mm:$("#ksdkjsmm").val()},
				url:"/obt/ksManage/kscdmm.do",
				success:function(data){
					if(data.success){
						enablekey();
					}else{ 
						smmctk('解锁密码有误,请您重新输入:');
					}
				}
			});
			}
		}).showModal();
 }
(function() {
  //字符串扩展
  String.prototype.format = function() {
    var c = arguments;
    return this.replace(/{(\d+)}/g, function(a, b) {
      return typeof c[b] != 'undefined' ? c[b] : a
    })
  };
  String.prototype.remove = function(a, b) {
    var l = this.slice(0, a);
    var r = this.slice(a + b);
    return l + r
  };
  Date.prototype.format = function (fmt) { //author: meizz 
      var o = {
          "M+": this.getMonth() + 1, //月份 
          "d+": this.getDate(), //日 
          "H+": this.getHours(), //小时 
          "m+": this.getMinutes(), //分 
          "s+": this.getSeconds(), //秒 
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
          "S": this.getMilliseconds() //毫秒 
      };
      if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return fmt;
  };

  if (!window.OBT) {
    window['OBT'] = {
      KEY_ITEMSAVE:'itSaveUrl',
      KEY_ITEM:'it_{0}',
      KEY_ITEM_PROGRESS:'ITEM-PROGRESS',
      KEY_CURPAPER:'CUR-PAPER',
      KEY_SEAT_NUMBER:'OBT_SEAT_ID.SEASKYLIGHT.COM',
      KEY_CURP_ITEM_TIME:'OBT_CURP_ITEM_TIME.COM',	//当前小题进入时间
      KEY_PAPER_CACHE:'OBT_PAPER_CACHE',
      EVENT_PAPER_CHANGED:'CUR-PAPER-CHANGED',
      EVENT_PAPER_CHANGING:'CUR-PAPER-CHANGING',
      EVENT_ITEM_CHANGING:'CUR-ITEM-CHANGING',
      EVENT_ITEM_CHANGED:'CUR-ITEM-CHANGED',
      EVENT_ANS_CHANGED:'ANS-CHANGED',
      EVENT_FLAG_CHANGED:'CUR-ITEM-FLAGED',
      _endTime: null,
      _timeDiff:0,//客户端和服务端的时间差值(毫秒)
      setStartTime: function(a) {
        OBT.storage.setSession(_startTimeKey, a);
        this._endTime = a + this.getDuration();
        OBT.storage.setSession(_endTimeKey, this._endTime);
      },
      getEndTime: function() {
        return this._endTime ? this._endTime : (parseInt(OBT.storage.getSession(_endTimeKey)) || 0);
      },
      getDuration: function() {
        
      },
      getNow: function() {
        //得到当前本地时间和服务器偏差后的时间
        return new Date().valueOf() + this._timeDiff;
      },
      getNowHHMMSS:function(){
        var currentDate = new Date(OBT.getNow());
        return currentDate.getHours()+':'+currentDate.getMinutes()+':'+currentDate.getSeconds();
      },
      syncTime:function(){
        $.ajax({
          url:"../svc/API/project/servertime",
          dataType:'json',
          data:'clienttime='+ new Date().valueOf(),
          success:function(data){
            OBT._timeDiff = data.message.timediff ;
            console.info(data.message);
          }
        });
      },
      showCalc: function () {
        if (document.getElementById('calc')) {
          $('#calc').show();
        } else {
          var $calc = $('<div id="calc" style="background-color: #E5EDF8;float:left;top:-260px;left:400px;z-index:9999;position:absolute;">aaa</div>');
          
          $calc.css('top', '-260px');
          $calc.width(220);
          $calc.height(260);
          $('body').append($calc);

          $calc.calculator({
            movable: true,
            width: 220,
            height: 260,
            defaultOpen: false
          });
          $calc.show();
        }
      },
      scrollTo:function(){
        //TODO
        var container = $('div'), scrollTo = $('#row_8');
        container.scrollTop(
        scrollTo.offset().top - container.offset().top + container.scrollTop());
        // Or you can animate the scrolling:
        container.animate({    scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()});
      }
    }
  }

  platform = window.navigator.platform;
  userAgent = window.navigator.userAgent;
  if (!OBT.os) OBT.os = {
    window: /Win/i.test(platform),
    mac: /Mac/i.test(platform),
    iOS: /iPhone/i.test(platform) || /iPad/i.test(platform),
    android: /Android/i.test(userAgent),
    linux: /Linux/i.test(platform),
    blackberry: /Blackberry/i.test(userAgent)
  };
  if (!OBT.browser) OBT.browser = {
    mozilla: /firefox/.test(navigator.userAgent.toLowerCase()),
    webkit: /webkit/.test(navigator.userAgent.toLowerCase()),
    opera: /opera/.test(navigator.userAgent.toLowerCase()),
    msie: !!window.ActiveXObject || "ActiveXObject" in window///msie/.test(navigator.userAgent.toLowerCase())
  };
  
  var i = 0;
  var d = null;
  if(!OBT.saveKsgj) OBT.saveKsgj = {
		  save:function(data){
			  $.ajax({
				  url:OBT.storage.getSession("basepath")+'/exam/ks/saveKsgj.do',
				  type:'POST',
				  dataType:'json',
				  contentType:'application/json',
				  data:data,
				  success:function(data) {
					i=0;
					if(data.status==-41) {
          				window.location.href=OBT.storage.getSession("basepath")+'/exam';
          			}
				  },
				  error:function(req, data, error){
					i++;
          			if(req.status==401) {
          				window.location.href=OBT.storage.getSession("basepath")+'/exam';
          			}
          			if(i>=5&&d==null){
          				d = dialog({id:'lx',title:'提示信息',content:'您与服务器已断开连接，请联系管理员',width:240,cancel:function(){d=null;},cancelDisplay:false});
						d.show();
          			}
          		}
			  });
		  }
  };

  if (!OBT.storage) OBT.storage = {
    getSession: function(a) {
      return window.sessionStorage.getItem(a);
    },
    setSession: function(a, b) {
    	if(OBT.storage.getSession(a)) {
    		OBT.storage.removeSession(a);
    	}
      window.sessionStorage.setItem(a, b);
    },
    removeSession: function(a) {
      window.sessionStorage.removeItem(a);
    },
    clearSession: function() {
      window.sessionStorage.clear();
    },
    getLocal: function(a) {
      return window.localStorage.getItem(a);
    },
    setLocal: function(a, b) {
      window.localStorage.setItem(a, b);
    },
    removeLocal: function(a) {
      window.localStorage.removeItem(a);
    },
    clearLocal: function() {
      window.localStorage.clear();
    }
  };
 })();