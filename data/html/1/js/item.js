;(function () {
  String.prototype.format = function () {
    var c = arguments;
    return this.replace(/{(\d+)}/g, function (a, b) {
      return typeof c[b] != 'undefined' ? c[b] : a
    })
  };
  String.prototype.remove = function (a, b) {
    var l = this.slice(0, a);
    var r = this.slice(a + b);
    return l + r
  };
  String.prototype.trim = function() {
    //return this.replace(/[(^\s+)(\s+$)]/g,'');//會把字符串中間的空白符也去掉
    //return this.replace(/^\s+|\s+$/g,''); //
    return this.replace(/^(\s|\u00A0)+/,'').replace(/(\s|\u00A0)+$/,'');//去掉g以稍稍提高性能 在小规模的处理字符串时性能较好 
  };
  
  function getomr(xtans) {
    var omr = null;

    if ( typeof(xtans) === 'string' && xtans != '') {
      omr = JSON.parse(xtans);
      if(typeof(omr.value) === 'undefined'){
        try{
          omr.value = parseInt(omr.answer);
        }catch(ex){
          omr.value = 0;
        }
      }
    }else{
      omr = {
        answer: '',
        value: 0,
        format: ''
      };
    }
    return omr;
  }
  function setomr (ito, omr) {
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
  }
  function ranomrfmt (oformat) {
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
  }

  // 小题插件
  var methods = {
    _init: function(options,icode) {
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
      
      return ito;
    },
    Choice :function(options,icode,a){
      //基本初始化
      var ito = methods._init.call(this,options,icode);
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
        oround: false,//随机顺序
        cancel: false //可以取消radio选项
      };
      var settings = $.extend({}, defaults, options); //将一个空对象做为第一个参数

      var omr = getomr(xtans);
      //生成选项顺序
      if(omr.format == '' && settings.oround){
        //默认的选项顺序
        var default_format ='';
        this.find('input').each(function () {
          //默认的选项顺序
          if(default_format != '')
            default_format +=',';
          default_format += $(this).val();
        });
        //随机选项顺序
        ito.format = omr.format = ranomrfmt(default_format);

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
        this.find('input').each(function(i){
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
      //多选multiple
      if(settings.itemtype == 'multiple'){
        var $inputs = this.find('input:checkbox');
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
        var $omrlabels = this.find('.itemChoice');
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

          //保存客观题
          if(omr.value != v){
            omr.value = v;
            omr.answer= v.toString();
            omr.needsave = true;
            $omrlabels.html(vlabel==''?'&nbsp;':vlabel);
            setomr(ito,omr);
          }
        });
        //多项选择初始化结束
      }else{
        //单项选择题初始化
        //还原作答
        var $inputs = this.find('input');
        var $omrlabels = this.find('.itemChoice');
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
          }else{
            $this.get(0).checked =false;
          }
        });
        //绑定点击事件
        this.find('input:radio').click(ito,function(e){
          var $click = $(this);
          var v = parseInt($click.val());
          //允许取消
          if(omr.value == v && settings.cancel){
            $click.get(0).checked = false;
            v = 0;
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
            setomr(e.data,omr);
          }
        });
        //单项选择初始化完成
      }
      return this;
    },
    Question:function(options,i,a){
      window.inputId =null;
      //基本初始化
      var ito = methods._init.call(this,options,i);
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
      this.find('textarea').each(function () {
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
          inputId = this.id;
        }
        //初始化编辑器
        //Editor.Init(inputId);
      });
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

