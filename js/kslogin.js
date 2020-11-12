String.prototype.trim=function(){
	return this.replace(/\s/g,'');
};

var kmtype = 1;
$(document).ready(function(){

	//赋值
	kmtype = OBT.storage.getSession("kmtype");
	if(!kmtype){
		kmtype = OBT.storage.getLocal("kmtype"); 
	}
	showDLXX(kmtype);
	//清除浏览器缓存
	OBT.storage.clearSession();
	OBT.storage.setSession("kmtype",kmtype);

	//加载答案页面
	loadHTML(kmtype);

	//绑定重置按钮事件
	$('#resetbtn').click(function() {
		$("#zkzh").val('');
		$("#zjbm").val('');
	});
	$('#loginbtn').click(function(){
		denglu2();
	});
	 
});

function denglu2() {
	var zkzh = $("#zkzh").val().trim();
	var zjbm = $("#zjbm").val().trim();
	var cdmm = $("#cdmm").val();
	if(null==zkzh||""==zkzh) {
		dialog({title:'登录信息',content:'请输入准考证号',quickClose: true}).show();
		$("#zkzh").focus();
		return;
	} else if(null==zjbm||""==zjbm) {
		dialog({title:'登录信息',content:'请输入证件号码',quickClose: true}).show();
		$("#zjbm").focus();
		return;
	} else {
		var ksinfo ;
		if(kmtype==1) {
			ksinfo = '{"userId":"88888888","userName":"xxx","sex":2,"candidateCode":"88888888","idno":"888888888888888888","ticketNo":"88888888","roomNo":"1","batchNo":4}'; 
		} else if (kmtype==2) {
			ksinfo = '{"userId":"88888888","userName":"xxx","sex":2,"candidateCode":"88888888","idno":"888888888888888888","ticketNo":"88888888","roomNo":"1","batchNo":4}';
		} else if (kmtype==3) {
			ksinfo = '{"userId":"88888888","userName":"xxx","sex":1,"candidateCode":"88888888","idno":"888888888888888888","ticketNo":"88888888","roomNo":"1","batchNo":4}';
		} else {
			ksinfo = '{"userId":"88888888","userName":"xxx","sex":1,"candidateCode":"88888888","idno":"888888888888888888","ticketNo":"88888888","roomNo":"1","batchNo":4}';
		}
		OBT.storage.setSession('CANDIDATE-INFO',ksinfo);
		url = 'before.html?time='+Date.parse(new Date());
		window.location.replace(url);
		
	}
}
function showDLXX(kmtype) {
		$("#zkzh").val("88888888");
		$("#zjbm").val("888888888888888888");
}

function loadHTML(kmtype) {
	loadSjHtml(kmtype);
}

function loadSjHtml(kmtype) {
	for (var i = 1; i <= 100; i++) {
		$.ajax({
			url:'data/html/'+ kmtype +'/'+ i +'.html',
			type:'GET',
			async:false,
			cache:true,
			success:function(data) {
				OBT.storage.setLocal(i,data);
			}
		});
	}
}
