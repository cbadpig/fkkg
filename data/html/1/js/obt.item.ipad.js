;(function () {
  String.prototype.format = function () {
    var c = arguments;
    return this.replace(/{(\d+)}/g, function (a, b) {
      return typeof c[b] != 'undefined' ? c[b] : a;
    });
  };
  String.prototype.remove = function (a, b) {
    var l = this.slice(0, a);
    var r = this.slice(a + b);
    return l + r;
  };
  if (!window.console) {
	  window.console = window.console || (function() {
	    var c = {};
	    c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function() {};
	    return c;
	  })();
	}
  String.prototype.trim = function() {
    //return this.replace(/[(^\s+)(\s+$)]/g,'');//會把字符串中間的空白符也去掉
    //return this.replace(/^\s+|\s+$/g,''); //
    return this.replace(/^(\s|\u00A0)+/,'').replace(/(\s|\u00A0)+$/,'');//去掉g以稍稍提高性能 在小规模的处理字符串时性能较好 
  };
  //使用父窗口的OBT
  if (window.parent != window) {
    window['OBT'] = window.parent.OBT;
  }

  if(!window.ITEM){
    //题目类库
    window['ITEM'] = {
      getomr:function(ito){
        //获得原始作答，优先OBT.paper，因为在paper初始化时，已经从session读取过了。
        //在无paper时，单独从session中恢复
        var omr = {
          answer: '',
          value: 0,
          format: '',
          needsave:false,
          flag:false
        };

        if (ito) {
          omr.answer = ito.answer;
          omr.format = ito.format;
          omr.needsave = ito.needsave;
          omr.flag = ito.flag;
          try{
            omr.value = parseInt(omr.answer);
          }catch(ex){
            omr.value = 0;
          }
        }else{
          var xtans = OBT.storage.getSession(ito.key);
          if(xtans)
            omr = JSON.parse(xtans);
        }
        return omr;
      },
      setomr:function(ito, omr) {
        console.log(ito.code+' SAVE--> '+JSON.stringify(omr));
        ito.answer = omr.answer;
        ito.needsave = omr.needsave;
        OBT.storage.setSession(ito.key, JSON.stringify(omr));
        if (window.parent != window) {
          // 框架内，通知外部框架保存答案
          setTimeout(function() {
            window.parent.$.publish(OBT.EVENT_ANS_CHANGED, [ito, omr]);
          }, 0);
        }
      },
      ranomrfmt :function (oformat) {
        var oArray = oformat.split(',');
        //随机排序
        oArray.sort(function() {
          return Math.random() - 0.5;
        });
        var nfmt = '';
        for (var i = 0; i < oArray.length; i++) {
          if (i > 0)
            nfmt += ',';
          nfmt += oArray[i];
        }
        return nfmt;
      },
      choiceInit:function($el,ito,settings){
        // 选择题初始化
        var omr = ITEM.getomr(ito);
        //生成选项顺序
        if(omr.format == '' && settings.oround){
          //默认的选项顺序
          var default_format ='';
          $el.find('input').each(function () {
            //默认的选项顺序
            if(default_format != '')
              default_format +=',';
            default_format += $(this).val();
          });
          //随机选项顺序
          ito.format = omr.format = ITEM.ranomrfmt(default_format);

          OBT.storage.setSession(ito.key, JSON.stringify(omr));
          console.log(default_format+' ROUND--> '+omr.format);
        }
        //复原选项顺序
        if(typeof omr.format === 'string' && omr.format != ''){

          var fmtAry = omr.format.split(',');
          //获取当前的父DIV
          var ctxAry = new Array();
          //排序后的DIV
          var newCtxAry = new Array();
          //原始ABCD标签数组
          var labelAry = new Array();
          $el.find('input').each(function(i){
            var $this = $(this);
            //原始DIV
            ctxAry[i] = $this.closest('.choiceContext');
            //保留原始标签ABCD的
            labelAry[i] = ctxAry[i].find('.choiceTitle:first').clone();
            //排序后的DIV
            newCtxAry[i] = ctxAry[i].clone();
            newCtxAry[i].data('OMR',$this.val());
          });
          //重新排序
          for(var i=0;i<fmtAry.length;i++){
            var findidx = -1;
            for(var j=i;j<newCtxAry.length;j++){
              if(fmtAry[i] == newCtxAry[j].data('OMR')){
                //插入新位置
                newCtxAry.splice(i,0,newCtxAry[j]);
                //删除原始位置
                newCtxAry.splice(j+1,1);
                break;
              }
            }
          }
          //重新显示
          for(var i=0;i<ctxAry.length;i++){
            //新DIV更新为旧的ABCD顺序
            newCtxAry[i].find('.choiceTitle:first').replaceWith(labelAry[i]);
            //显示
            ctxAry[i].replaceWith(newCtxAry[i]);
          }
        }
        return omr;
      },
      singleInit:function ($el,ito,settings){
        var omr = ITEM.choiceInit($el,ito,settings);
        //单项选择题初始化
        //还原作答
        var $inputs = $el.find('input');
        var $omrlabels = $el.find('.itemChoice');
        $inputs.each(function () {
          var $this = $(this);
          //保存选项标签到数据
          var vlabel = $this.closest('.choiceContext').find('.choiceTitle:first').html();
          $this.data('LABEL',vlabel);
          //判断当前选择
          var v = parseInt($this.val());
          if(omr.value == v){
            $this.get(0).checked =true;
            $omrlabels.html(vlabel);
			$this.parent("label").addClass("hover");
          }else{
            $this.get(0).checked =false;
			$this.parent("label").removeClass("hover");
          }
        });
		
        //绑定点击事件
        $el.find('input:radio').click(ito,function(e){
          var $click = $(this);
          var v = parseInt($click.val());
		  $el.find('input:radio').each(function(){
			$(this).parent("label").removeClass("hover");
		  });
          $click.parent("label").addClass("hover");
          //允许取消
          if(omr.value == v && settings.cancel){
            $click.get(0).checked = false;
            v = 0;
			$click.parent("label").removeClass("hover");
          }

          //保存客观题
          if(omr.value != v){
            omr.value = v;
            omr.answer= v.toString();
            omr.needsave = true;
            //更新显示标签
            if($click.get(0).checked){
              $omrlabels.html($click.data('LABEL'));
            }else{
              $omrlabels.html('&nbsp;');
            }
            //保存答案
            ITEM.setomr(e.data,omr);
          }
        });
        //单项选择初始化完成
      },
      multipleInit:function ($el,ito,settings){
        var omr = ITEM.choiceInit($el,ito,settings);
        var $inputs = $el.find('input:checkbox');
        //所有选择取消
        $inputs.get(0).checked =false;

        //更新已作答内容
        var _curOpt = 1,_ansValue = omr.value;
        while (omr.value >= _curOpt) {
          // 当前选项被选中
          if (omr.value & _curOpt) {
            var $curInput = $inputs.filter('[value="' + _curOpt + '"]');
            //选择
            $curInput.get(0).checked =true;
			$($curInput).parent("label").addClass("hover");
          }
          _curOpt *= 2;
        }
        //更新选择标签
        var vlabel = '';
        $inputs.each(function () {
          var $this = $(this);
          //保存选项标签到数据
          var lbl = $this.closest('.choiceContext').find('.choiceTitle:first').html();
          $this.data('LABEL',lbl);
          if($this.get(0).checked){
            //标签
            vlabel += lbl;
          }
        });
        var $omrlabels = $el.find('.itemChoice');
        $omrlabels.html(vlabel==''?'&nbsp;':vlabel);

        //绑定点击事件
        $inputs.click(ito,function(e){
          var $click = $(this);
          var v = 0,vlabel = '';
          // 计算多选题答案
          $inputs.each(function(){
            var $this = $(this);
            if( $this.get(0).checked){
              v += parseInt($this.val());
              //标签
              vlabel += $this.data('LABEL');
            }
          });
		 $click.parent("label").removeClass("hover");
		if($click.get(0).checked==true){
			 $click.parent("label").addClass("hover");
		}
          //保存客观题
          if(omr.value != v){
            omr.value = v;
            omr.answer= v.toString();
            omr.needsave = true;
            $omrlabels.html(vlabel==''?'&nbsp;':vlabel);
            ITEM.setomr(ito,omr);
          }
        });
        //多项选择初始化结束
      },
      questionInit:function($el,options,i,a){
        // TODO
        window.inputId =null;
        //基本初始化
        var ito = methods._init.call($el,options,i);
        //获得原始作答，优先直接指定
        var xtans = a;
        if(xtans === undefined || xtans == null){
          //从Session中获得原始作答
          xtans = OBT.storage.getSession(ito.key);
        }
        //默认值
        if(xtans === undefined || xtans == null){
          xtans = '';
        }
        // 选择题初始化
        var defaults = {
          itemtype : 'single', //单选single，多选multiple
          tcopy: false,//随机顺序
          cancel: false //可以取消radio选项
        };
        var settings = $.extend({}, defaults, options); //将一个空对象做为第一个参数
        //找到所有的文本输入框，创建可编辑的DIV层
        $el.find('textarea').each(function () {
          var divW = this.offsetWidth;
          var divH = this.offsetHeight;
          //console.info('Create Div '+this.id+' width='+divW+' height='+divH);
          this.style.display = 'none';
          var $textDiv = $('<div id="'+this.id + '_div"></div>');
          $textDiv.height(divH);
          $textDiv.width(divW -20);

          // if ($('#tab li').length > 5) d.style.height = c - 15 + 'px';
          // else d.style.height = c + 'px';
          
          $textDiv.css({'border':'1px solid #CCC','padding':'8px','overflow':'auto'});

          $textDiv.attr('contentEditable', true);
          $(this).before($textDiv);
          //绑定点击事件
          $textDiv.on('click',ito,function (event) {
            inputId = $textDiv.attr('id');
          });
          $textDiv.on('mouseup keyup',ito,function (event) {
            var xtans = $(this).html();
            if(xtans != '') {
              console.info(xtans);
              OBT.storage.setSession(event.data.key,xtans);
            }
            //Editor.__range = OBT.range.getRange();
          });
          //选择当前输入框
          if(inputId ==null || inputId == ''){
            inputId = $el.id;
          }
          //初始化编辑器
          //Editor.Init(inputId);
        });
      }

    }
  }
  //标记类库
  if(!ITEM.mark) ITEM.mark ={
    GetNextLeaf: function (node) {
      while (!node.nextSibling) {
        node = node.parentNode;
        if (!node) {
          return node;
        }
      }
      var leaf = node.nextSibling;
      while (leaf.firstChild) {
        leaf = leaf.firstChild;
      }
      return leaf;
    },
    GetPreviousLeaf:function(node) {
      while (!node.previousSibling) {
        node = node.parentNode;
        if (!node) {
          return node;
        }
      }
      var leaf = node.previousSibling;
      while (leaf.lastChild) {
        leaf = leaf.lastChild;
      }
      return leaf;
    },
    // If the text content of an element contains white-spaces only, then does not need to colorize
    IsTextVisible:function (text) {
      for (var i = 0; i < text.length; i++) {
        if (text[i] != ' ' && text[i] != '\t' && text[i] != '\r' && text[i] != '\n')
          return true;
      }
      return false;
    },
    ColorizeLeaf:function (node, color) {
      if (!ITEM.mark.IsTextVisible(node.textContent))
        return;
      var parentNode = node.parentNode;
      if(!parentNode)
        return;
      // if the node does not have siblings and the parent is a span element, then modify its color
      if (!node.previousSibling && !node.nextSibling) {
        if (parentNode.tagName.toLowerCase() == "span") {
          parentNode.style.backgroundColor = color;
          return;
        }
      }
      // Create a span element around the node
      var span = document.createElement("span");
      span.style.backgroundColor = color;
      var nextSibling = node.nextSibling;
      parentNode.removeChild(node);
      span.appendChild(node);
      parentNode.insertBefore(span, nextSibling);
    },
    ColorizeLeafFromTo: function (node, color, from, to) {
      var text = node.textContent;
      if (!ITEM.mark.IsTextVisible(text))
        return;

      if (from < 0)
        from = 0;
      if (to < 0)
        to = text.length;

      if (from == 0 && to >= text.length) {
        // to avoid unnecessary span elements
        ITEM.mark.ColorizeLeaf(node, color);
        return;
      }

      var part1 = text.substring(0, from);
      var part2 = text.substring(from, to);
      var part3 = text.substring(to, text.length);

      var parentNode = node.parentNode;
      var nextSibling = node.nextSibling;

      parentNode.removeChild(node);
      if (part1.length > 0) {
        var textNode = document.createTextNode(part1);
        parentNode.insertBefore(textNode, nextSibling);
      }
      if (part2.length > 0) {
        var span = document.createElement("span");
        span.style.backgroundColor = color;
        var textNode = document.createTextNode(part2);
        span.appendChild(textNode);
        parentNode.insertBefore(span, nextSibling);
      }
      if (part3.length > 0) {
        var textNode = document.createTextNode(part3);
        parentNode.insertBefore(textNode, nextSibling);
      }
    },
    ColorizeNode:function (node, color) {
      var childNode = node.firstChild;
      if (!childNode) {
        ITEM.mark.ColorizeLeaf(node, color);
        return;
      }

      while (childNode) {
        // store the next sibling of the childNode, because colorizing modifies the DOM structure
        var nextSibling = childNode.nextSibling;
        ITEM.mark.ColorizeNode(childNode, color);
        childNode = nextSibling;
      }
    },
    ColorizeNodeFromTo:function (node, color, from, to) {
      var childNode = node.firstChild;
      if (!childNode) {
        ITEM.mark.ColorizeLeafFromTo(node, color, from, to);
        return;
      }

      for (var i = from; i < to; i++) {
        ITEM.mark.ColorizeNode(node.childNodes[i], color);
      }
    },
    ColorizeSelection:function (color) {
      if (!!window.ActiveXObject || "ActiveXObject" in window) {
          document.execCommand("BackColor", false, color);
          return;
      }
      // all browsers, except IE before version 9
      if (window.getSelection) {
        var selectionRange = window.getSelection();

        if (selectionRange.isCollapsed) {
          return;
        }

        var range = selectionRange.getRangeAt(0);
        // store the start and end points of the current selection, because the selection will be removed
        var startContainer = range.startContainer;
        var startOffset = range.startOffset;
        var endContainer = range.endContainer;
        var endOffset = range.endOffset;
        // because of Opera, we need to remove the selection before modifying the DOM hierarchy
        selectionRange.removeAllRanges();

        if (startContainer == endContainer) {
          //同一个节点时，直接标记颜色
          ITEM.mark.ColorizeNodeFromTo(startContainer, color, startOffset, endOffset);
        } else {
          if (startContainer.firstChild) {
            var startLeaf = startContainer.childNodes[startOffset];
          } else {
            //标记第一段节点
            var startLeaf = ITEM.mark.GetNextLeaf(startContainer);
            ITEM.mark.ColorizeLeafFromTo(startContainer, color, startOffset, -1);
          }

          if (endContainer.firstChild) {
            if (endOffset > 0) {
              var endLeaf = endContainer.childNodes[endOffset - 1];
            } else {
              var endLeaf = ITEM.mark.GetPreviousLeaf(endContainer);
            }
          } else {
            var endLeaf = ITEM.mark.GetPreviousLeaf(endContainer);
            ITEM.mark.ColorizeLeafFromTo(endContainer, color, 0, endOffset);
          }

          while (startLeaf) {
            var nextLeaf = ITEM.mark.GetNextLeaf(startLeaf);
            ITEM.mark.ColorizeLeaf(startLeaf, color);
            if (startLeaf == endLeaf) {
              break;
            }
            startLeaf = nextLeaf;
          }
        }
      } else {
        // Internet Explorer before version 9
        document.execCommand("BackColor", false, color);
      }
    }
  }

  //小题JQUERY插件
  var defaults = {
    itemtype : 'single', //单选single，多选multiple
    oround: false,//随机顺序
    cancel: false //可以取消radio选项
  };
  // 小题插件
  var methods = {
    _init: function(options,icode) {
      // 选择题初始化
      var settings = $.extend({}, defaults, options); //将一个空对象做为第一个参数

      var ito =null;
      if(icode && OBT && OBT.paper){
        ito = OBT.paper.getItem(icode);
      }
      if(ito ==null){
        ito = {
          id:0,
          no:0,
          name:'0',
          code: '0',
          key: 'it_0'
        }
      }
      //小题名称
      this.find('.itemName:first').text(ito.name);
      //选择题初始化
      if(settings.itemtype ==='single'){
        //单选
        ITEM.singleInit(this,ito,settings);
      }else if(settings.itemtype ==='multiple'){
        //多选
        ITEM.multipleInit(this,ito,settings);
      }else if(settings.itemtype === 'composite'){
        //复合题
        ITEM.choiceInit(this,ito,settings);
      }else if(settings.itemtype === 'question'){
        //主观题
      }
      return this;
    },
    destroy: function () {
      return this.each(function () {
        var $this = $(this);
        $this.removeData();
        //console.info('destroy');
      });
    }
  }
  //选择插件构建
  $.fn.item = function(method) {
    // 方法调用
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method == 'object' || !method) {
      return methods._init.apply(this, arguments);
    } else {
      $.error('Method' + method + 'does not exist on jQuery.item');
    }
  }

})();

