define(['jquery', 'jquery.slimscroll', 'basic'], function($, sl, basicJs) {
    function player(settings) {
        var me = this;
        this.Utils = new basicJs.Utils();
        this.settings = {
            speed: 800
        }
        $.extend(this.settings, settings || {});

        this.body = $('body');
        this.init();
        $('.play-list-group').slimScroll({
            opacity: 1,
            allowPageScroll: true
        });

        this.playerWrapper = $('.player-wrapper');
        this.modeList = $('.mode-list')
        this.modeListBtn = $('.mode-list-btn');
        this.playListSectionWrapper = $('.play-list-section-wrapper');
        this.listWindowCloseBtn = $('.list-window-close');

        this.processLine = $('.process-line');


        this.lrcArray = [];

        this.songArray = [];


        this.audio = $('#audio');
        this.preBtn = $('#prev-btn i');
        this.nextBtn = $('#next-btn i');
        this.preBtn.click(function(e) {
            var prev = $('.li-selected').prev();
            var list = $('.play-list-info');
            var Utils = me.Utils;
            var mode = Utils.getLocalStorage("_mode_");

            if (mode === "dqxh") {
                $('.li-selected').trigger("click");
            } else if (mode === "lbxh") {
                if (prev.length === 0) {
                    //播放最后一个
                    list.eq(list.length - 1).trigger("click");
                } else {
                    prev.trigger("click");
                }
            } else if (mode === "sxbf") {
                prev.trigger("click");
            } else if (mode === "sjbf") {
                var idx = Math.floor(Math.random() * $('.play-list-info').length);
                list.eq(idx).trigger("click");
            } else {
                throw ("line 58 error");
            }
            //点击前一首需要重置
            me.reset();
        });

        this.nextBtn.click(function(e) {
            var next = $('.li-selected').next();
            var list = $('.play-list-info');
            var Utils = me.Utils;
            var mode = Utils.getLocalStorage("_mode_");

            if (mode === "dqxh") {
                $('.li-selected').trigger("click");
            } else if (mode === "lbxh") {
                if (next.length === 0) {
                    //播放第一个
                    list.eq(0).trigger("click");
                } else {
                    next.trigger("click");
                }
            } else if (mode === "sxbf") {
                next.trigger("click");
            } else if (mode === "sjbf") {
                var idx = Math.floor(Math.random() * $('.play-list-info').length);
                list.eq(idx).trigger("click");
            } else {
                throw ("line 58 error");
            }

            //点击下一首需要重置
            me.reset();
        });





        me.playerWrapper.animate({
            bottom: "0px"
        }, this.settings.speed);

        // 播放器模块显示flag,初始为true
        this.showing = true;
        // 播放器模块动画 运行中flag,初始为false
        this.running = false;

        // 模式列表显示flag,初始为false
        this.modelistShowing = false;
        // 播放列表显示flag,初始为false
        this.playListSectionWrapperShowing = false;

        // 测试用
        // this.insert();

        //通过Ajax获得音乐列表
        this.getMusicList();

        //读取用户播放模式
        this.playMode = this.getPlayMode();

        //点击播放进度条flag,初始为false
        this.processClickFlag = false;
        //播放进度,初始为0
        this.currentPercent = 0;

        //歌曲时间数组
        this.timeArray = new Array();
        //歌词数组
        this.lrc2Array = new Array();
        //歌词标志数组
        this.lrcFlagArray = new Array();
        //歌词下标
        this.lrcIndex = 0;

        this.playLrcSection = $('.play-lrc-section');

        /*添加事件*/

        //包裹层点击事件,仅阻止冒泡
        this.playerWrapper.click(function(e) {
            e.stopPropagation();
        });



        //点击进度条事件
        this.processLine.click(function(e) {

            if (me.audio.attr("src") != '') {
                //获取坐标,得到应该播放的进度
                var mouseX = e.pageX;
                var processX = $(this).offset().left;
                var processLineWidth = $(this).width();

                var percent = (mouseX - processX) / processLineWidth.toFixed(2);
                var playLrcSection = $('.play-lrc-section');
                var height = playLrcSection.height();

                me.processClickFlag = true;

                var t = Math.floor((percent * height) / 30);
                playLrcSection.css({
                    top: -t * 30
                });

                var length = Math.floor(Math.abs(parseInt(playLrcSection.css("top"))) / 30);
                var lrcFlagArray = me.lrcFlagArray;
                if (me.currentPercent < percent) {
                    //快进                       
                    for (var i = 0; i < length; i++) {
                        lrcFlagArray[i] = true;
                    }

                    $('.current-lrc').removeClass();
                    $('.play-lrc-section p').eq(length).addClass("current-lrc");
                } else {
                    //快退
                    for (var i = length - 1; i < me.lrcFlagArray.length; i++) {
                        lrcFlagArray[i] = false;
                    }

                    var h = parseInt(playLrcSection.css("top"));
                    playLrcSection.css({
                        top: h + 30
                    });

                    $('.current-lrc').removeClass();

                    $('.play-lrc-section p').eq(length - 1).addClass("current-lrc");
                }

                //更改当前进度
                me.currentPercent = percent;

                me.audio[0].currentTime = percent * me.audio[0].duration;

                me.startProcessUpdate(me);
            }
        });


        me.audio[0].ontimeupdate = function(e) {

            if (me.processClickFlag) {
                var prevTop = parseInt(me.playLrcSection.css("top"));
                me.playLrcSection.css({
                    top: prevTop + 30
                });
                me.processClickFlag = false;
            } else {
                var flag = false;
                var currentTime = this.currentTime;
                var timeArray = me.timeArray;
                var lrcFlagArray = me.lrcFlagArray;
                for (var i = 0; i < timeArray.length; i++) {
                    if (currentTime > timeArray[i] && !lrcFlagArray[i]) {
                        lrcFlagArray[i] = true;
                        if (i != me.lrcIndex) {
                            me.lrcIndex = i;
                            flag = true;
                        }
                        break;
                    }
                }
                if (flag) {
                    var prevTop = parseInt(me.playLrcSection.css("top"));
                    var next = $('.current-lrc').next('p');
                    $('.current-lrc').removeClass();
                    next.addClass("current-lrc");
                    me.playLrcSection.css({
                        top: prevTop - 30
                    });
                }
            }
            me.currentPercent = Math.abs(parseInt(me.playLrcSection.css("top")) / me.playLrcSection.height());
        };







        // 播放模式列表点击事件
        this.modeListBtn.click(function(e) {
            if (!me.modelistShowing) {
                me.modeList.fadeIn(function() {
                    me.modelistShowing = true;
                });
            } else if (me.modelistShowing) {
                me.modeList.fadeOut(function() {
                    me.modelistShowing = false;
                });
            }
            e.stopPropagation();
        });

        /*
        // 改变播放模式事件
        this.modeList.delegate('a', 'click', function(e) {
        	var target = $(e.target);
        	if (target.hasClass('mode-dqxh')) {
        		// alert("单曲循环");
        	} else if (target.hasClass('mode-lbxh')) {
        		// alert("列表循环");
        	} else if (target.hasClass('mode-sxbf')) {
        		// alert("顺序播放");
        	} else if (target.hasClass('mode-sjbf')) {
        		// alert("随机播放");
        	} else {
        		throw ('播放模式错误');
        	}
        	me.modeListBtn.trigger('click');
        	e.stopPropagation();
        });*/

        // 播放列表显示事件
        $('.play-list-btn').click(function() {
            if (!me.playListSectionWrapperShowing) {
                me.playListSectionWrapper.fadeIn(function() {
                    me.playListSectionWrapperShowing = true;
                });
            } else {
                me.playListSectionWrapper.fadeOut(function() {
                    me.playListSectionWrapperShowing = false;
                });
            }
        });
        // 播放列表关闭事件(关闭按钮)
        this.listWindowCloseBtn.click(function() {
            if (me.playListSectionWrapperShowing) {
                me.playListSectionWrapper.fadeOut(function() {
                    me.playListSectionWrapperShowing = false;
                });
            }
        });
        this.playList = $('.play-list');
        // 播放列表鼠标进入,离开和点击事件,事件委托
        this.playList.delegate('li', 'mouseenter', function(e) {
            var $this = $(this);
            // 阻止冒泡会导致虚拟滚动条无效,可以考虑加个wrapper
            // 改变样式
            $this.addClass("li-entered");
            // 显示操作图标(删除......)
            $this.find('.op-icon').show();
        }).delegate('li', 'mouseleave', function(e) {
            var $this = $(this);
            e.stopPropagation();
            $this.removeClass("li-entered");
            $this.find('.op-icon').hide();
        }).delegate('li', 'click', function(e) {
            var $this = $(this);
            e.stopPropagation();
            $this.addClass("li-selected");
            // 移除所有其他li的selected类名
            $('.play-list li').not($this).removeClass("li-selected");

            // 播放事件
            // todo 获取歌曲路径
            me.audio.attr("src", decodeURIComponent($this.attr("data-path")));
            //切换歌曲时需要重置标志
            me.reset();
            // 更改播放图标并播放
            $('#play-btn i').removeClass("fa-play-circle-o")
                .addClass("fa-pause-circle-o");
            if (me.audio.attr("src") != '') {
                me.getLrc($this);
                me.audio[0].play();
                // 更新显示信息
                var duration = $('.li-selected .col-duration').text();
                var songName = $('.li-selected .col-song').text();

                $('.list-current-song').text(songName);
                $('.music-info-name').text(songName);
                $('.process-time span').eq(1).text(duration);
                me.startProcessUpdate(me);
            }

        });

        // 更改垃圾桶图标,事件委托
        this.playList.delegate('i', 'mouseover', function(e) {
            var $this = $(this);
            if ($this.hasClass("fa-trash-o")) {
                $this.removeClass("fa-trash-o").addClass("fa-trash");
            }
        }).delegate('i', 'mouseout', function(e) {
            var $this = $(this);
            if ($this.hasClass("fa-trash")) {
                $this.removeClass("fa-trash").addClass("fa-trash-o");
            }
        }).delegate('i', 'click', function(e) {
            e.stopPropagation();
        });

        $('#play-btn i').click(function(e) {
            e.stopPropagation();
            var icon = $(this);
            var audio = me.audio;
            if (icon.hasClass("fa-pause-circle-o")) {
                // 暂停
                if (audio.attr("src") != '') {
                    audio[0].pause();
                    icon.removeClass("fa-pause-circle-o")
                        .addClass("fa-play-circle-o");
                    clearInterval(me.processInterval);
                }

            } else if (icon.hasClass("fa-play-circle-o")) {
                // 播放
                if (audio.attr("src") != '') {
                    audio[0].play();
                    icon.removeClass("fa-play-circle-o")
                        .addClass("fa-pause-circle-o");
                    me.startProcessUpdate(me);
                }
            } else {
                throw ("179 lines error");
            }
        });

        $('.mode-list a i').click(function(e) {
            e.stopPropagation();
        });
        $('.mode-list a').click(function(e) {
            e.stopPropagation();
            var $this = $(this);
            var Utils = me.Utils;
            if ($this.hasClass("mode-dqxh")) {
                Utils.setLocalStorage("_mode_", "dqxh");
            } else if ($this.hasClass("mode-lbxh")) {
                Utils.setLocalStorage("_mode_", "lbxh");
            } else if ($this.hasClass("mode-sxbf")) {
                Utils.setLocalStorage("_mode_", "sxbf");
            } else if ($this.hasClass("mode-sjbf")) {
                Utils.setLocalStorage("_mode_", "sjbf");
            } else {
                throw ("line 246 mode error");
            }
            $('.mode-list-btn-i').removeClass().addClass("mode-list-btn-i " + $this.find("i").attr("class") + " fa-lg").removeClass("fa-fw");
            me.modeListBtn.trigger("click");
        });





        // 窗口点击事件
        $(window).click(function() {
            // 加载完成后,点击窗口其他部分隐藏或显示播放器
            if (!me.running) {
                me.running = true;
                if (me.showing) {
                    me.playerWrapper.animate({
                        bottom: "-53px"
                    }, me.settings.speed, function() {
                        me.modelistShowing = true;
                        me.modeListBtn.trigger('click');
                        // 点击窗口其他部分触发播放列表关闭事件
                        me.listWindowCloseBtn.trigger('click');
                    });
                    me.showing = false;
                } else {
                    me.playerWrapper.animate({
                        bottom: "0px"
                    }, me.settings.speed);
                    me.showing = true;
                }
                me.running = false;
            }
        });

        me.audio[0].onended = function(e) {
            console.log("ended!");
            me.nextBtn.trigger("click");
        }
    }
    var instance;
    player.prototype = {
        reset: function() {
            this.lrc2Array.length = 0;
            this.timeArray.length = 0;
            this.lrcFlagArray.length = 0;
            this.lrcIndex = 0;
            this.processClickFlag = false;
            this.currentPercent = 0;
            this.playLrcSection.css({
                top: 0
            });
        },
        showLrc: function(data) {
            var me = this;
            var playLrcSection = me.playLrcSection;
            playLrcSection.html("");
            data = $.parseJSON(data);
            var count = 0;
            var timeStringArray = new Array();
            var timeIntArray = new Array();
            var lrcArray = new Array();
            var lrcLength = 0;
            for (var key in data) {
                // 把时间转为String
                // 未考虑[ti:]
                timeStringArray[count] = JSON.stringify(key);
                if (timeStringArray[count].length > 10 && data[key].trim() != '') {
                    console.log(timeStringArray[count]);
                    var minute = parseInt(timeStringArray[count].slice(2, 4));
                    var second = parseFloat(timeStringArray[count].slice(5, 10));
                    // 播放时间转换为Number类型
                    var timeToInt = minute * 60 + second;
                    // 时间存入数组
                    timeIntArray[count] = timeToInt;
                    // 歌词存入数组
                    lrcArray[count] = data[key].trim();
                    count++;
                }
            }
            lrcLength = count;

            var html = "<p>这是空白占位符</p>";

            for (var key in lrcArray) {
                if (key == 0) {
                    html += "<p class=\"current-lrc\">" + lrcArray[key] + "</p>";
                } else {
                    html += "<p>" + lrcArray[key].trim() + "</p>";
                }

            }
            playLrcSection.append(html);
            me.lrc2Array = lrcArray;
            me.timeArray = timeIntArray;
            for (var i = 0; i < me.lrc2Array.length; i++) {
                me.lrcFlagArray[i] = false;
            }
        },
        getLrc: function($song) {
            /*异步获取歌词*/
            var me = this;
            var index = $song.index(".play-list-info");

            $.ajax({
                url: "getlrc.action?action=gtl&lrcUrl=" + this.lrcArray[index],
                method: 'GET',
                dataType: 'text',
                data: "",
                success: function(musicListObj) {
                    // 转为JSON数组
                    me.showLrc(musicListObj);
                },
                error: function() {
                    alert('error');
                }
            });

        },
        insertLrc: function() {
            /*测试用*/
            var playLrcSection = this.playLrcSection;
            var html = "";
            for (var i = 0; i < 30; i++) {
                html += "<p>哈哈哈哈" + i + "</p>";
            }
            playLrcSection.append(html);
        },
        getPlayMode: function() {
            //打开页面时读取播放模式
            var Utils = this.Utils;
            if (Utils.getLocalStorage("_mode_") === null) {
                console.log("播放模式为空,自动设置为顺序播放");
                Utils.setLocalStorage("_mode_", "sxbf");
            }
            var mode = Utils.getLocalStorage("_mode_");
            //加载页面时更新播放模式图标
            $('.mode-list-btn-i').removeClass().addClass("mode-list-btn-i " + $('.mode-' + mode).find('i').attr("class") + " fa-lg");
            return mode;
        },
        /*更改时间显示和进度条进度*/
        startProcessUpdate: function(me) {
            // 进度条更新
            //重要!!!一定要先清除之前的Interval
            clearInterval(me.processInterval);
            me.processInterval = setInterval(
                function() {
                    var currentTime = me.audio[0].currentTime;
                    var currentMin = Math.floor(currentTime / 60);
                    var currentSec = (currentTime - currentMin * 60)
                        .toString().split(".")[0];
                    if (Number(currentMin) < 10) {
                        currentMin = "0" + currentMin;
                    }
                    if (Number(currentSec) < 10) {
                        currentSec = "0" + currentSec;
                    }
                    var percent = 1 - (currentTime / me.audio[0].duration);
                    if (percent == 0) {
                        clearInterval(me.processInterval);
                    }
                    // 进度
                    $('.current-process').css({
                        right: (percent * 100) + "%"
                    });
                    // 时间进度
                    $('.process-time span').eq(0).text(
                        currentMin + ":" + currentSec);
                }, 60);
        },
        getDuration: function(duration) {
            duration = Number(duration);
            var min = Math.floor(duration / 60);
            var sec = duration - min * 60;
            if (Number(min) < 10) {
                min = "0" + min;
            }
            if (Number(sec) < 10) {
                sec = "0" + sec;
            }
            return min + ":" + sec;
        },
        insertData: function(musicObjArray) {
            var me = this;
            var list = $(me.playList[0]);
            var html = "";
            for (var i = 0; i < musicObjArray.length; i++) {
                var music = musicObjArray[i];
                var duration = me.getDuration(music["duration"]);
                //abandon
                me.songArray.push(music["path"]);
                me.lrcArray.push(music["lrcPath"]);

                var musicPath = encodeURIComponent(music["path"]);
                html += '<li data-path=' + musicPath + ' class="play-list-info">' + '<div class="col col-sp"></div>' + '<div class="col col-song">' + music["songname"] + '</div>' + '<div class="col col-op">' + '<i class="fa fa-trash-o op-icon remove-icon"></i>' + '<i class="fa fa-search op-icon search-icon"></i>' + '</div>' + '<div class="col col-singer">' + music["singername"] + '</div>' + '<div class="col col-duration">' + duration + '</div>' + '</li>';
            }
            list.append(html);
        },
        getMusicList: function() {
            var me = this;
            $.ajax({
                url: "getmusic.action?action=gta",
                method: 'GET',
                dataType: 'text',
                data: "",
                success: function(musicListObj) {
                    musicListObj = '[' + musicListObj + ']';
                    // 转为JSON数组
                    var jsonArray = JSON.parse(musicListObj)
                    me.insertData(jsonArray);
                },
                error: function() {
                    alert('error');
                }
            });
        },
        insert: function() {
        	/*测试用*/
            var html = '<li>' + '<div class="col col-sp"></div>' + '<div class="col col-song">演员</div>' + '<div class="col col-op">' + '<i class="fa fa-trash-o remove-icon"></i>' + '</div>' + '<div class="col col-singer">李荣浩</div>' + '<div class="col col-duration">4:00</div>' + '</li>';
            var list = $(this.playList[0]);
            for (var i = 0; i < 20; i++) {
                list.append(html);
            }
        },
        init: function() {
        	/*初始化DOM结构*/
            var html = '<div class="player-wrapper">' + '<div class="player-section">' + '<!-- 按钮区域 -->' + '<div class="player-btns-wrapper">' + '<div class="player-btns">' + '<a href="javascript:;" id="prev-btn">' + '<i class="fa fa-step-backward fa-lg"></i>' + '</a>' + '<a href="javascript:;" id="play-btn">' + '<i class="fa fa-play-circle-o fa-2x"></i>' + '</a>' + '<a href="javascript:;" id="next-btn">' + '<i class="fa fa-step-forward fa-lg"></i>' + '</a>' + '</div>' + '</div>' + '<!-- 播放区域:歌曲信息,歌曲进度控制,歌词区域(扩展) -->' + '<div class="player-display">' + '<!-- 歌曲信息 -->' + '<div class="music-info">' + '<!-- 歌曲封面 -->' + '<!-- <img src="" alt="" style="width:100%"> -->' + '<!-- 歌名 -->' + '<span class="music-info-name">时代之梦</span>&nbsp;' + '<!-- 歌手名 -->' + '<span class="music-info-singer">逃跑计划</span>' + '</div>' + '<!-- 进度控制区域 -->' + '<div class="process-info">' + '<!-- 进度条 -->' + '<div class="process-line"><div class="current-process"></div></div>' + '<!-- 时间 -->' + '<span class="process-time"><span>2.00</span>/<span>4.00</span></span>' + '</div>' + '</div>' + '<!-- 音量控制,播放列表 -->' + '<div class="player-controller-wrapper">' + '<div class="player-controller">' + '<div class="player-btns player-btns-right">' + '<a href="javascript:;" class="btns-right-wrapper">' + '<i class="fa fa-volume-up fa-lg volume-control-btn"></i>' + '</a>' + '<a href="javascript:;" class="mode-list-btn btns-right-wrapper">' + '<i class="fa fa-random fa-lg  mode-list-btn-i"></i>' + '</a>' + '<a href="javascript:;" class="btns-right-wrapper">' + '<i class="fa fa-list-ol fa-lg play-list-btn"></i>' + '</a>' + '</div>' + '<div class="list-group mode-list" style="display:none">' + '<a class="list-group-item mode-dqxh" href="javascript:;"><i class="fa fa-repeat fa-fw"></i>&nbsp; 单曲循环</a>' + '<a class="list-group-item mode-lbxh" href="javascript:;"><i class="fa fa-refresh fa-fw"></i>&nbsp; 列表循环</a>' + '<a class="list-group-item mode-sxbf" href="javascript:;"><i class="fa fa-align-justify fa-fw"></i>&nbsp; 顺序播放</a>' + '<a class="list-group-item mode-sjbf" href="javascript:;"><i class="fa fa-random fa-fw"></i>&nbsp; 随机播放</a>' + '</div>' + '</div>' + '</div>' + '</div>' + '<div class="play-list-section-wrapper" style="display:none">' + '<div class="play-list-section">' + '<div class="play-list-head">' + '<h4>播放列表</h4>' + '<a class="list-remove-all list-icon" href="javascript:;"><i class="fa fa-trash"></i>清除列表</a>' + '<p class="list-current-song list-icon"">时代之梦</p>' + '<a class="list-window-close list-icon" href="javascript:;"><i class="fa fa-close fa-lg"></i></a>' + '</div>' + '<div class="play-list-body">' + '<div class="play-list-wrapper-for-scroll">' + '<div class="play-list-group" style="width:99%">' + '<ul class="play-list">' + '<li song="actor">' + '<div class="col col-sp"></div>' + '<div class="col col-song">演员</div>' + '<div class="col col-op">' + '<i class="fa fa-trash-o remove-icon"></i>' + '</div>' + '<div class="col col-singer">李荣浩</div>' + '<div class="col col-duration">4:00</div>' + '</li>' + '<li song="actor">' + '<div class="col col-sp"></div>' + '<div class="col col-song">演员</div>' + '<div class="col col-op">' + '<i class="fa fa-trash-o remove-icon"></i>' + '</div>' + '<div class="col col-singer">李荣浩</div>' + '<div class="col col-duration">4:00</div>' + '</li>' + '</ul>' + '</div>' + '</div>' + '<div class="play-lrc-section"></div>' + '</div>' + '</div>' + '</div>' + '<div class="audio-wrapper" style="display:none; position:absolute;width:20px;height:20px;">' + '<audio src="" id="audio"></audio>' + '</div>' + '</div>';
            this.body.append(html);
        }
    }
    return {
        player: function() {
            if (instance == null) {
                instance = new player();
            }
            return instance;
        }
    }
});
