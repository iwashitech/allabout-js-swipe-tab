(function (window, document, $, undefined) {
    (window.homeUI = {
        init: function () {
            var self = this;
            $(function () {
                self.swipeTabContent();
            });
        },
        // 記事の全文表示
        swipeTabContent: function () {
            var $swipeTab = $('.js-swipe-tab');
            var $swipeTabList = $('.js-swipe-tab-list'); // スワイプメニュー
            var $swipeTabItem = $swipeTabList.find('div').not('.js-swipe-tab-move');
            var $swipeMove = $('.js-swipe-tab-move'); // カレントボックス
            var $swipeTabDefault = $('.js-swipe-tab-list').find('.current'); // デフォルトのカレント要素
            var $swipeCont = $('.js-swipe-cont');
            var $window = $(window);
            var winWidth = $window.width();
            var listWidth = $swipeTabList.width();
            var arrElemWidth = [];
            var defaultIndex = $swipeTabItem.index($swipeTabDefault);
            var currentIndex = 0;
            var nextIndex = 0;
            var listDistance = 0;
            var defaultOffset = 0;

            function init() {
                initTab();
                initCont();
            }

            function initTab() {
                // 移動距離の計算のため、各要素のwidthを格納
                for (var i = 0; i < $swipeTabItem.length; i++) {
                    arrElemWidth.push(Math.floor($swipeTabItem.eq(i).width()));
                }
                // 初期表示位置を指定してiscrollを実行
                defaultOffset = sumUp(0, defaultIndex, arrElemWidth);
                listDistance = -defaultOffset;

                // カレントボックスをデフォルト位置に表示
                $swipeMove.css({
                    left: defaultOffset,
                    width: $swipeTabDefault.width() + 1
                });
                // 初期表示時のチラつきを防ぐためタブの初期位置設定が完了したら、表示
                $swipeTab.addClass('is-ready');
                // タブタップ時のイベント登録
                $swipeTabItem.on('click', function () {
                    // 移動先の要素と現在のcurrent要素を取得
                    nextIndex = $swipeTabItem.index($(this));
                    currentIndex = $swipeTabItem.index($swipeTabList.find('.current'));
                    tabMainStream(currentIndex, nextIndex);
                });
            }

            function initCont() {
                // コンテンツ部分のスワイプ
                var $swipeContWrap = $('.js-swipe-cont-wrap');
                // プラグインによるデフォルトアクションの無効化プロパティを削除
                delete Hammer.defaults.cssProps.userSelect;
                delete Hammer.defaults.cssProps.userDrag;
                delete Hammer.defaults.cssProps.tapHighlightColor;
                delete Hammer.defaults.cssProps.touchCallout;
                delete Hammer.defaults.cssProps.touchAction;
                // スワイプアクションの検出範囲設定
                var hammerObj = new Hammer($swipeContWrap.get(0));
                hammerObj.set({
                    direction: Hammer.DIRECTION_ALL,
                    threshold: 10,
                    velocity: 0.3
                });

                // 左から右にスワイプ時の処理：戻る
                hammerObj.on('swiperight', function (event) {
                    if (Math.abs(event.deltaY) > 100) {
                        return false;
                    }
                    currentIndex = $swipeTabItem.index($swipeTabList.find('.current'));
                    nextIndex = currentIndex - 1;
                    if (currentIndex === 0) {
                        return false;
                    }
                    tabMainStream(currentIndex, nextIndex);
                });
                // 右から左にスワイプ時の処理：進む
                hammerObj.on('swipeleft', function (event) {
                    if (Math.abs(event.deltaY) > 100) {
                        return false;
                    }
                    currentIndex = $swipeTabItem.index($swipeTabList.find('.current'));
                    nextIndex = currentIndex + 1;
                    if (currentIndex === $swipeTabItem.length - 1) {
                        return false;
                    }
                    tabMainStream(currentIndex, nextIndex);
                });
            }

            function tabMainStream(currentIndex, nextIndex) {
                winWidth = $window.width();
                $swipeTabList.find('.current').removeClass('current');
                // コンテンツの表示切替
                $swipeCont.removeClass('current');
                $swipeCont.eq(nextIndex).addClass('current');
                // 選択位置に応じたリストの移動
                if (nextIndex > currentIndex) {
                    calcPos('next', nextIndex);
                } else {
                    calcPos('prev', nextIndex);
                }
                $swipeTabItem.eq(nextIndex).addClass('current');
                move(listDistance, nextIndex);
            }
            // from番目からto番目までを足し合わせた値を返す
            function sumUp(from, to, arr) {
                var sumResult = 0;
                for (var i = from; i < to; i++) {
                    sumResult += arr[i];
                }
                return sumResult;
            }
            // transformXの値を取得
            function getTranslateX($elem) {
                var transformMatrix = $elem.css("-webkit-transform") ||
                    $elem.css("-moz-transform") ||
                    $elem.css("-ms-transform") ||
                    $elem.css("-o-transform") ||
                    $elem.css("transform");
                var matrix = transformMatrix.replace(/[^0-9\-.,]/g, '').split(',');
                var xValue = parseInt(matrix[12] || matrix[4], 10);
                return xValue;
            }

            function move(distance, nextIndex) {
                // カレントブロックのリサイズと移動
                $swipeMove.stop().animate({
                    left: sumUp(0, nextIndex, arrElemWidth),
                    width: arrElemWidth[nextIndex]
                }, 300);
                // lazyloadの強制実行
                $("body").trigger("scroll").scrollTop(0);
            }

            function calcPos(direction, nextIndex) {
                // 親要素の左端から選択要素の終わりまでの距離を取得
                var absoluteDistance = sumUp(0, nextIndex + 1, arrElemWidth);
                // 現在のlistのtranslateXを取得
                var currentTranslateX = getTranslateX($swipeTabList);
                //console.log('x:', currentTranslateX);
                // 現在のカレントの左端から選択要素の右端までの距離
                var betweenDistance = absoluteDistance + currentTranslateX;
                //console.log('between:', betweenDistance); 
                var diff = winWidth * 0.6 - betweenDistance;

                // 画面上の表示位置が画面幅の一定割合を超えていたら
                if ((direction === 'next' && betweenDistance > winWidth * 0.6) ||
                    (direction === 'prev' && betweenDistance < winWidth * 0.6)) {
                    listDistance = currentTranslateX + diff;
                } else {
                    listDistance = currentTranslateX;
                }
                // 移動できる最大値を超えた場合は最大値に設定
                if (listWidth < Math.abs(listDistance) + winWidth) {
                    listDistance = winWidth - listWidth;
                } else if (listDistance > 0) {
                    listDistance = 0;
                }
            }
            init();
        }
    }).init();
})(window, document, jQuery);