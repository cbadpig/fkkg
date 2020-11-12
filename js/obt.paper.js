;(function() {
	if (!window.console) {
		  window.console = window.console || (function() {
		    var c = {};
		    c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function() {};
		    return c;
		  })();
		}

  if(!OBT) OBT={};
  if (!OBT.paper) {
    OBT.paper = {
      _papers: null,//_papers.data[]存放试卷数组对象；_papers.count试卷数量;_papers.xxx，存放指向该试卷data的数组指针；
      _subjects:null,//
      _progress:{},
      _curpaper:null,
      init: function(sparams,pparams,options) {
       var settings = $.extend({
          clearAnswer :false,//清除考生本地作答内容
          saveURL : null//小题答案保存URL路径
        }, options || {});

        //小题保存URL
        if(settings.saveURL){
          OBT.storage.setSession(OBT.KEY_ITEMSAVE,settings.saveURL);
        }else{
          var surl = OBT.storage.getSession(OBT.KEY_ITEMSAVE);
          if(!surl){
            surl = purl().attr("directory")+'items/save';
            OBT.storage.setSession(OBT.KEY_ITEMSAVE,surl);
          }
        }
        //清除考生本地作答内容
        if(settings.clearAnswer){
          OBT.storage.clearSession(OBT.KEY_ITEM_PROGRESS);
          OBT.storage.clearSession(OBT.KEY_CURPAPER);
        }
        //从本地存储恢复当前试卷进度信息
        var papercur = OBT.storage.getSession(OBT.KEY_ITEM_PROGRESS);
        if( papercur ){
          this._progress = JSON.parse(papercur);
        }
        //从本地存储恢复当前试卷信息
        papercur = OBT.storage.getSession(OBT.KEY_CURPAPER);
        if(papercur){
          this._curpaper = papercur;
        }

        //装载科目
        var len = sparams.length;
        for (var i =0;i<len;i++) {
          OBT.paper.addSubject(sparams[i],settings);
        };
        //装载试卷
        len = pparams.length;
        for (var i =0;i<len;i++) {
          OBT.paper.addPaper(pparams[i],settings);
        };
        //保存作答进度到本地存储
        OBT.storage.setSession(OBT.KEY_ITEM_PROGRESS,JSON.stringify(this._progress));
        OBT.storage.setSession(OBT.KEY_CURPAPER,this._curpaper);
      },
      addSubject:function(s,settings){
        if(!this._subjects){
          this._subjects = {};
          this._subjects.data = [];
          this._subjects.count = 0;
        }
        //保存数组指针，避免多份数据
        this._subjects[s.paperCode] = this._subjects.count;
        this._subjects.data.push(s);
        this._subjects.count ++;
      },
      getSubjects:function(){
        return this._subjects;
      },
      getCurSubject:function(){
        if(this._curpaper ){
          return this._subjects.data[this._subjects[this._curpaper]];
        }
        return null;
      },
      getSubject:function(pcode){
        if(pcode ){
          return this._subjects.data[this._subjects[pcode]];
        }
        return null;
      },
      getPapers:function(){
        return this._papers;
      },
      getProgress:function(){
        return this._progress;
      },
      addPaper:function(p,settings){
        if(!this._papers){
          this._papers = {};
          this._papers.data = [];
          this._papers.count = 0;
        }
        //初始化大题
        p.groupMap = {};
        for(var i=0;i< p.groups.length;i++){
          //定义大题指针
          p.groupMap[p.groups[i].no] = i;
        }
        //初始化小题
        p.itemMap = {};
        //该试卷当前未作答小题
        var curitemcode =null;
        var itemlen = p.items.length;
        //复合题对应关系Map
        var pitemMap = {};
        for (var i=0;i< itemlen;i++){
          //定义小题指针
          p.itemMap[p.items[i].code] = i;
          
          var curans = null;
          if(!settings.clearAnswer){
            //以当前Session中的答案为主
            curans = OBT.storage.getSession(OBT.KEY_ITEM.format(p.items[i].code));
          }

          if(curans && curans.length >0){
            //从session中还原答案，暂无使用地方
            var ans = JSON.parse(curans);
            p.items[i].answer = ans.answer;
            p.items[i].format = ans.format;
            p.items[i].flag = ans.flag;
            p.items[i].needsave = ans.needsave || false;
            p.items[i].zdcs = ans.zdcs;
            p.items[i].zdsc = ans.zdsc;
          }else{
            //默认保存标志为true
            p.items[i].needsave = false;
            //小题标记标志
            p.items[i].flag = p.items[i].flag;
            //保存初始化答案到Session
            var ans = '{"answer":"'+ p.items[i].answer+'","format":"'+p.items[i].format+'","flag":"'+ p.items[i].flag +'","zdcs":"'+ p.items[i].zdcs +'","zdsc":"'+ p.items[i].zdsc +'"}';
            OBT.storage.setSession(OBT.KEY_ITEM.format(p.items[i].code), ans);
          }
          //读取SESSION的key
          p.items[i].key = 'it_'+p.items[i].code;
          //当前试卷第一个未作答小题
          if(!curitemcode && p.items[i].answer.length == 0){
            curitemcode = p.items[i].code;
          }
          //复合题处理
          if(p.items[i].level >0){
            var picode = p.items[i].pcode;
            //有父小题代码
            if(picode && picode.length > 0){
              if(typeof(pitemMap[picode]) ==='undefined' || pitemMap[picode] ==null){
                pitemMap[picode] = new Array();
              }
              pitemMap[picode].push(p.items[i].code);
            }
          }
        }
        //复合题处理
        for(var picode in pitemMap){
          //得到父小题
          var idx = p.itemMap[picode];
          if(typeof(idx) === 'number'){
            p.items[idx].childrens = pitemMap[picode];
          }
          
        }
        //保存数组指针，避免多份数据
        this._papers[p.code] = this._papers.count;
        this._papers.data.push(p);
        this._papers.count ++;

        //设置当前试卷
        if(this._curpaper == null){
          //第一个序号为0的作为优先试卷
          if(p.order <=0)
            this.setCurPaper(p.code);
        }
        //生成当前试卷进度对象
        if(typeof (this._progress[p.code]) === 'undefined' || this._progress[p.code] ==null){
          if(!curitemcode)
            curitemcode = p.items[0].code;
          this._progress[p.code] = curitemcode;
          //保存到session
          OBT.storage.setSession(OBT.KEY_ITEM_PROGRESS,JSON.stringify(this._progress));
        }
      },
      setCurPaper:function(pcode){
        if (typeof pcode === 'number') {
          //直接指定试卷序号
          if(pcode >= 0 && pcode < this._papers.data.length){
            this._curpaper = this._papers.data[pcode].code;
            OBT.storage.setSession(OBT.KEY_CURPAPER,this._curpaper);
          }
        }else
        if(typeof pcode === 'string'){
          this._curpaper = pcode;
          OBT.storage.setSession(OBT.KEY_CURPAPER,this._curpaper);
        }
      },
      getCurPaper:function(){
        var pidx = this._papers[this._curpaper];
        return this._papers.data[pidx];
      },
      getCurItem: function() {
        var idx = this.getCurItemIdx();
        return this.getCurPaper().items[idx];
      },
      getPrevItem: function(){
        var idx = this.getCurItemIdx();
        //当前为第一题，没有上一题了
        if(idx <= 0)
          return null;
        var po = this.getCurPaper();
        while(idx--){
          if(po.items[idx].level ==0){
            return po.items[idx];
          }
        }
      },
      getNextItem: function(){
        var po = this.getCurPaper();
        var idx = this.getCurItemIdx();
        //当前为第一题，没有上一题了
        var max =po.items.length -1
        if(idx >= max)
          return null;
        while(idx ++ < max){
          if(po.items[idx].level ==0){
            return po.items[idx];
          }
        }
      },
      getCurItemIdx:function(){
        var icode = this._progress[this._curpaper];
        return this.getCurPaper().itemMap[icode];
      },
      setCurItem: function(icode) {
        this._progress[this._curpaper] = icode;
        //保存到session
        OBT.storage.setSession(OBT.KEY_ITEM_PROGRESS,JSON.stringify(this._progress));
      },
      getItemCount: function() {
        return OBT.paper.count;
      },
      getPaper:function(pcode){
        if (typeof pcode === 'number') {
          //直接指定试卷序号
          if(pcode > 0 && pcode <= this._papers.data.length)
            return this._papers.data[pcode -1];
        }else
        if(typeof pcode === 'string'){
          //指定试卷代码
          var index = this._papers[pcode];
          if(index !=null)
            return this._papers.data[index];
        }else{
          return null;
        }
      },
      getItem:function(){
        var icode,pcode;
        if(arguments.length <=0)
          return this.getCurItem();
        else if(arguments.length ==1){
          icode = arguments[0];
          pcode = this._curpaper;
        }else{
          pcode = arguments[0];
          icode = arguments[1];
        }
        if(!icode || typeof(icode) === 'undefined')
          return null;
        //优先当前试卷
        var po = this.getPaper(pcode);
        var ito = po.items[po.itemMap[icode]];
        return ito;
      },
      clearAns: function(){
        OBT.storage.clearSession();
      },
      setCurItemTime:function(ito){
    	$.ajax({
    		url:OBT.storage.getSession("basepath")+"/exam/ks/setCurItemTime.do",
    		type:"post",
    		dataType:'json',
   	      	contentType:'application/json',	
    		data:JSON.stringify(ito),
    		success:function(){
    		},
    		error:function(){
    		}
    	});
      },
      getCurItemTime:function(){
    	  var curItemTime = JSON.parse(OBT.storage.getSession(OBT.KEY_CURP_ITEM_TIME));
    	  return curItemTime.curtime;
      }
    };
  }
})();