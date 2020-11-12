;(function($, window, document, undefined) {
	if (!window.console) {
		  window.console = window.console || (function() {
		    var c = {};
		    c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function() {};
		    return c;
		  })();
		}
  //创建科目导航tab
	function createSubjectDiv(settings){
		var subjects = OBT.paper.getSubjects();
		var len = subjects.count;
		//单科目无需tab
		if(len <= 1)
			return;
		//当前试卷
		var po = OBT.paper.getCurPaper();
		var $subul = $('<div id="subjecttab"><ul class="ul-subject"></ul></div>');
		for(var i=0;i< len;i++){
			var $subtab = $('<li><a href="#'+subjects.data[i].paperCode+'">'+subjects.data[i].name+'</a></li>');
			//当前tab
			if(po.code == subjects.data[i].paperCode)
				$subtab.toggleClass('active',true);
			//绑定科目切换事件
			$subtab.children('a').bind("click",subjects.data[i].paperCode,function(e) {
				if(e.data == OBT.paper.getCurPaper().code)
					return;
				//发布当前试卷更改事件
				//$.publish(OBT.EVENT_PAPER_CHANGING,[e.data]);
			});
			//补充到ul中
			//$subul.children('ul').append($subtab);
		}
		return $subul;
	}
	//创建试卷导航DIV
	function createPaperDiv(settings){
		var papers = OBT.paper.getPapers();
		var len = papers.count;
		//当前试卷
		var curpo = OBT.paper.getCurPaper();
		//作答进度
		var progress = OBT.paper.getProgress();

		var $pdiv = $('<div id="papernav"></div>');
		for(var i=0;i< len;i++){
			//试卷对象
			var po = papers.data[i];
			
			//试卷分组
			var $pul = $('<ul id="P-'+po.code+'"></ul>');
			//当前试卷显示
			if(po.code == curpo.code){
				$pul.show();
			}else{
				$pul.hide();
			}
			//大题标题
			var glen = po.groups.length;
			for(var j=0;j< glen;j++){
				//大题标题
				var $gtitle = $('<p><a href="#">&nbsp;&nbsp;'+po.groups[j].name+'</a></p>');
				//绑定大题标题点击事件
				$gtitle.children('a').click(function(e) {
					var $this = $(this);
					//右边图标切换
					$this.closest('p').toggleClass('hide');
					//小题区域显示隐藏切换
					$this.closest('li').find('.subitem').slideToggle();
				});
				//本大题下小题区域
				var $itdiv = $('<div class="subitem"></div>');
				
				var itlen = po.groups[j].itemCodes.length;
				for(var k=0;k< itlen;k++){
					var icode = po.groups[j].itemCodes[k];
					//小题对象，根据小题code从itemMap中获得数组指针，然后再得到真实的对象
					var ito = po.items[po.itemMap[icode]];
					//console.log(JSON.stringify(i));
					//只有顶级小题才有导航
					if(ito.level > 0)
						continue;
					//小题按钮
					var $itbtn = $('<a href="#IT-'+ito.code+'">'+ito.name+'&nbsp;</a>');
					//当前小题
					if(icode == progress[po.code]){
						$itbtn.addClass('active');
					}
					//小题标记
					if(ito.flag==1) {
						$itbtn.append(settings.flag);
						if(parseInt(ito.answer)>0)
							$itbtn.addClass("green1");
					} else{
						//未作答
						if(ito.type ==='COMPOSITE'){
							//复合小题
							var done = true;
							for(var l=0;l<ito.childrens.length;l++){
								var cito = OBT.paper.getItem(po.code,ito.childrens[l]);
								if(cito && (cito.answer.length == 0||parseInt(ito.answer)==0)){
									done = false;
									break;
								}
							}
							if(!done){
								$itbtn.append(settings.noans);
							} else {
								$itbtn.addClass("green1");
							}
						}else{
							if(ito.answer.length ==0||parseInt(ito.answer)==0)
								$itbtn.append(settings.noans);
							else
								$itbtn.addClass("green1");
						}
					}
					//绑定小题点击事件
					$itbtn.bind('click', ito, function(e) {
						//发布当前小题事件
						var curito = OBT.paper.getCurItem();
						$.publish(OBT.EVENT_ITEM_CHANGING,[curito,e.data]);
					});//end 小题生成
					//增加到小题区域中
					$itdiv.append($itbtn);
				}//end 大题生成
				//合并到试卷中
				$pul.append($('<li></li>').append($gtitle).append($itdiv));
			}//end 试卷生成
			$pdiv.append($pul);
		}
		return $pdiv;
	}
	$.fn.ItemNav = function(options){
		var defaults = {
			oround: false,//随机顺序
			cancel: false, //可以取消radio选项
			flag:'<span style="color: red">?</span>',
			noans:'<span style="color: red">*</span>'
		};
		var settings = $.extend({}, defaults, options); //将一个空对象做为第一个参数
		var xtarea = this;
		//科目导航栏
		/*var $stabs = createSubjectDiv(settings);
		if($stabs){
			xtarea.append($stabs);
		}*/
		//试卷小题按钮区
		var $itemdiv = createPaperDiv(settings);
		if($itemdiv)
			xtarea.append($itemdiv);
		//处理小题改变事件
		$.subscribe(OBT.EVENT_ITEM_CHANGED, function(_,old,ito){
			//现有小题
			if(old.code == ito.code)
				return false;
			//当前试卷
			var po = OBT.paper.getCurPaper();
			var $paper = $('#P-'+po.code);
			$paper.find('a.active').each(function(index, el) {
				$(this).removeClass('active');
			});
			$paper.find('a[href="#IT-'+ito.code+'"]').addClass('active');
		});
		//处理小题作答事件，标记已作答
		$.subscribe(OBT.EVENT_ANS_CHANGED, function(_,ito,ans){
			if(parseInt(ito.level) == 0){
				
				//当前试卷
				var po = OBT.paper.getCurPaper();
				var $paper = $('#P-'+po.code);
				//不能移除标记
				if(ito.flag==1){
					var $item = $('#P-'+po.code).find('a[href="#IT-'+ito.code+'"]');
					$item.addClass("green1");
					return;
				}
				if(parseInt(ito.answer)==0){
					//取消答案回复星号标记
					var $item = $('#P-'+po.code).find('a[href="#IT-'+ito.code+'"]');
					$item.children('span').remove();
					$item.append(settings.noans);
					$item.removeClass("green1");
				} else {
					var $item = $paper.find('a[href="#IT-'+ito.code+'"]');
					$item.children('span').remove();
					$item.addClass("green1");
				}
			}else{
				//复合小题处理
				var pito = OBT.paper.getItem(ito.pcode);
				if(pito ==null)
					return;
				//标记了当前题
				if(pito.flag==1)
					return;
				var done = true;
				for(var i=0;i<pito.childrens.length;i++){
					var cito = OBT.paper.getItem(pito.childrens[i]);
					console.log("chiled answer:"+cito.answer);
					if(cito && (cito.answer.length==0||parseInt(cito.answer)==0)){
						done = false;
						break;
					}
				}
				if(done){
					var po = OBT.paper.getCurPaper();
					var $paper = $('#P-'+po.code);
					var $item = $paper.find('a[href="#IT-'+pito.code+'"]');
					$item.children('span').remove();
					$item.addClass("green1");
				} else {
					console.log("done["+ done +"]");
					var po = OBT.paper.getCurPaper();
					var $item = $('#P-'+po.code).find('a[href="#IT-'+pito.code+'"]');
					$item.children('span').remove();
					$item.append(settings.noans);
					$item.removeClass("green1");
				}
			}
		});
		//处理标记更改事件
		$.subscribe(OBT.EVENT_FLAG_CHANGED, function(_,ito){
			//当前试卷
			var po = OBT.paper.getCurPaper();
			var $item = $('#P-'+po.code).find('a[href="#IT-'+ito.code+'"]');
			$item.children('span').remove();
			if(ito.flag==1)
				$item.append(settings.flag);
			else {
				if(ito.type ==='COMPOSITE'){
					//复合小题
					var done = true;
					for(var i=0;i<ito.childrens.length;i++){
						var cito = OBT.paper.getItem(ito.childrens[i]);
						if(cito &&( cito.answer.length==0||parseInt(cito.answer)==0)){
							done = false;
							break;
						}
					}
					if(!done){
						$item.append(settings.noans);
					}
				}else{
					if(ito.answer.length ==0||parseInt(ito.answer)==0)
						$item.append(settings.noans);
				}
			}
		});
	}
	// 行排列导航条
	$.fn.ItemLine = function(options) {
		var defaults = {
			oround: false,//随机顺序
			cancel: false //可以取消radio选项
		};
		var settings = $.extend({}, defaults, options); //将一个空对象做为第一个参数
		var xtline = this;
		xtline.navline({
　　    items: OBT.paper.getCurPaper().itArray.length,
			displayedPages: 10,
			currentPage:OBT.getCurItemIdx() +1,
			onPageClick:function(i, event){
				//设置当前小题，该插件的页码从1开始，而不是0开始
				var item = OBT.setCurItemIdx(i -1);
				//发布当前小题事件
				$.publish('CUR-ITEM-CHANGED',[item]);
			}
　　 });
		//绑定当前小题变更事件
		$.subscribe('CUR-ITEM-CHANGED', function(_,it){
			xtline.navline('drawPage',it.idx +1);
		});
	}
	//上一题
	$.fn.PrevButton = function(options){
		var $this = $(this);
		//第一小题时，禁用当前按钮
		var ito = OBT.paper.getPrevItem();
		if(ito){
			$this.removeAttr('disabled');
		}else{
			$this.attr('disabled',true);
		}
		//绑定按钮点击事件
		$this.bind("click",function(e){
			var ito = OBT.paper.getPrevItem();
			if(ito ==null){
				return;
			}
			//发布当前小题改变中事件
			var curito = OBT.paper.getCurItem();
			$.publish(OBT.EVENT_ITEM_CHANGING,[curito,ito]);
		});
		//处理小题改变事件
		$.subscribe(OBT.EVENT_ITEM_CHANGED, function(_,old,ito){
			//第一小题时，禁用当前按钮
			var preito = OBT.paper.getPrevItem();
			if(preito){
				$this.removeAttr('disabled');
			}else{
				$this.attr('disabled',true);
			}
			//更新连接
			if($this.is('a')){
				$this.attr('href','#IT-'+preito.code );
			}
		});
	}
	//下一题
	$.fn.NextButton = function(){
		var $this = $(this);
		//第一小题时，禁用当前按钮
		var ito = OBT.paper.getNextItem();
		if(ito){
			$this.removeAttr('disabled');
		}else{
			$this.attr('disabled',true);
		}
		//绑定按钮点击事件
		$this.bind("click",function(e){
			var ito = OBT.paper.getNextItem();
			if(ito ==null){
				return;
			}
			//发布当前小题改变中事件
			var curito = OBT.paper.getCurItem();
			$.publish(OBT.EVENT_ITEM_CHANGING,[curito,ito]);
		});
		//处理小题改变事件
		$.subscribe(OBT.EVENT_ITEM_CHANGED, function(_,old,ito){
			//第一小题时，禁用当前按钮
			var nextito = OBT.paper.getNextItem();
			if(nextito){
				$this.removeAttr('disabled');
			}else{
				$this.attr('disabled',true);
			}
			//更新连接
			if($this.is('a')){
				$this.attr('href','#IT-'+nextito.code );
			}
		});
	}
})(jQuery, window, document);