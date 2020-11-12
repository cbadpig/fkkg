
$(document).keydown(function(event) {
	if(event.keyCode==8) {
        return false;
    }
});

$(document).ready(function(){
	
	setTimeout(function(){
		window.close();
	},5*60*1000);

	$(".endtext").text("国家统一法律职业资格考试计算机化考试模拟答题演示");

});

