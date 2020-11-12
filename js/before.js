$(document).keydown(function(event) {
	if(event.keyCode==8) {
        return false;
    }
});

$(document).ready(function() {
	if (!window.console) {
		window.console = window.console || (function() {
			var c = {};
			c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function() {};
			return c;
		})();
	}
	
	//显示"自动化测试..."
	var isAutoTest = OBT.storage.getSession("isAutoTest");
	if(isAutoTest!=undefined){
		$("#zdhcs").css("display","block");
	}
	$("#czsm").click(function(){
		$("#mainText").attr("src","handleHelp2.html?time="+Date.parse(new Date()));
	});
	$("#ysgz").click(function(){
		$("#mainText").attr("src","Rule2.html?time="+Date.parse(new Date()));
	});
	$("#kwyq").click(function(){
		$("#mainText").attr("src","examRequired2.html?time="+Date.parse(new Date()));
	});
	$("#mainText").attr("src","examRequired2.html?time="+Date.parse(new Date()));
	getKsInfo();
	//获取项目基本信息
	document.title="国家统一法律职业资格考试计算机化考试模拟答题演示";
	//缓存试卷
	cachesj();
	
  //计时器
  $("#clock").timeTo("ksToStart",function(){

	  OBT.storage.removeSession("ss");
      var url = 'obttest.html?time='+Date.parse(new Date());
	  var checkBox = document.getElementById("check");
      if(checkBox.checked == true){
          window.location.replace(url);
      }
      else {
          return;
      }
  });

  clickImg();
});
//绑定照片点击事件
function clickImg(){
	$("#kspic").click(function(){
		getKsInfo();
	});
}

function getKsInfo(){
	  var ksinfo = OBT.storage.getSession('CANDIDATE-INFO');
	  if (!ksinfo) {
	    var url = '../fkkg';
	    window.location.replace(url);
	  }
	  ksinfo = JSON.parse(ksinfo);
	  $('#ksxm').text(ksinfo.userName);
	  $('#ksxb').text(ksinfo.sex == 1 ? "男" : "女");
	  $('#zkzh').text(ksinfo.ticketNo);
	  $('#sfzh').text(ksinfo.idno);
}

/**
 * 缓存试卷
 */
function cachesj(){
	var kmtype = OBT.storage.getSession("kmtype");
	var url = 'data/json/'+ kmtype +'.json';
	$.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      contentType:'application/json',
      cache: false, //禁用缓存 
      success: function(data) {
    	  if(data.status==1){
    		OBT.storage.setSession(OBT.KEY_PAPER_CACHE,JSON.stringify(data.message));
    	  }
      },
      error: function(req, data, error) {
      	if(req.status==401) {
    			var url='../fkkg';
    			window.location.replace(url);
    	}
       }
    });
}



