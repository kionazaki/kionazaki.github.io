/** Created by Nazaki on 14.04.2016 **/
"use strict";

var screenModule;
screenModule = (function () {
    var component,    // родительский элемент
        cols,         // Количество колонок в игровом поле
        rows,         // Количество строк в игровом поле
        k,            // Коэфициент пропорциональности высоты к ширине
        pgPercentage, // Сколько % занимает игровое поле от общей ширины компонента
        widthMin;     // Минимальная ширина, на которую можно масштабировать компонент

    // Режимы компонента
    var modes = {
        dragAndDrop: false,
        pauseMode: false,
        fullScreen: false
    };

    // Размерности компонента
    var currentMeasures = {
        width: null,	// Ширина элемента
        height: null,  // Высота элемента
        clientWidth: null,  // Текущая ширина окна браузера
        clientHeight: null, // Текущая высота окна браузера
        top: null,	// расстояние до верхней границы окна браузера
        left: null	// расстояние до левой границы окна браузера
    };

    // Размерности в момент клика по компоненту
    var measuresOnClick = {
        x: null,        // Координата X курсора на момент клика (относительно окна браузера)
        y: null,        // Координата Y курсора на момент клика (относительно окна браузера)
        top: null,      // Координаты component на момент клика
        right: null,    // Координаты component на момент клика
        bottom: null, 	 // Координаты component на момент клика
        left: null   	 // Координаты component на момент клика
        //flag: false     // Признак нажатой левой кнопки мыши
    };

    // Установка нового компонента
    function setupNewComponent(settings) {
        component = settings.component;
        cols = settings.cols || 10;
        rows = settings.rows || 20;
        pgPercentage = settings.pgPercentage || 70;
        widthMin = settings.widthMin || 150;
        setWidth(settings.width || 300);
        k = calculateK(currentMeasures.width);
        setHeight(currentMeasures.width * k);
        currentMeasures.top = settings.top || 10;
        currentMeasures.left = settings.left || 10;
        // Генерация общего CSS для скелета компонента
        createCSS();
        // Генерация DOM для скелета компонента
        createElements();
        // Расчитывает все "расмерные" свойства CSS и меняет их
        drawAll();
        // Подключение событий
        assignEvents();
        // Размеры страницы получаем уже после отрисовки объекта
        // т.к. изначально у него не абсолютное позиционирование и он тоже может влиять на размеры окна
        currentMeasures.clientWidth = getRealDocumentWidth();
        currentMeasures.clientHeight = getRealDocumentHeight();
    }

    // Изменяет ширину компонента
    function setWidth(width) {
        currentMeasures.width = Math.max(width, widthMin);
        return this;
    }

    // Изменяет высоту компонента
    function setHeight(height) {
        currentMeasures.height = Math.max(height, widthMin * k);
        return this;
    }

    // Расчитывает коефициент пропорчиональности высоты компоненты к ширине
    function calculateK(width) {
        return (getBrickWidth() * rows + (rows + 1) * getPlaygroundSpacing() + 2 * getPlaygroundBorder() + 2) / width;
    }

    // Расчитывает размер кубика
    function getBrickWidth() {
        return Math.ceil((getPlaygroundWidth() - 2 - 2 * getPlaygroundBorder() - (cols + 1) * getPlaygroundSpacing()) / cols);
    }

    // Расчитывает размер игровой зоны
    function getPlaygroundWidth() {
        return Math.round(currentMeasures.width * pgPercentage / 100);
    }

    // Расчитывает ширину рамки игровой зоны
    function getPlaygroundBorder() {
        return Math.round(getPlaygroundWidth() / 60);
    }

    // Расчитывает расстояние между кубиками
    function getPlaygroundSpacing() {
        return Math.round(getPlaygroundWidth() / (12 * cols));
    }

    function getCubeOutlineWidth() {
        return Math.round(getPlaygroundWidth() / (4.5 * cols));
    }

    // Генерация общего CSS для скелета компонента
    function createCSS() {
        var style = document.createElement('style');

        style.innerHTML = '@font-face{' +
            'font-family: "Ticking Timebomb";' +
            'src: url("fonts/ticking-timebomb-webfont.eot");' +
            'src: url("fonts/ticking-timebomb-webfont.eot?#iefix") format("embedded-opentype"),' +
            'url("fonts/ticking-timebomb-webfont.woff2") format("woff2"),' +
            'url("fonts/ticking-timebomb-webfont.woff") format("woff"),' +
            'url("fonts/ticking-timebomb-webfont.ttf") format("truetype"),' +
            'url("fonts/ticking-timebomb-webfont.svg#ticking_timebomb_bbitalic") format("svg");' +
            'font-weight: normal;' +
            'font-style: normal;}' +
            '' +
            '#' + component.id + '{' +
            'font-family: "Ticking Timebomb", sans-serif; ' +
            'border: 1px solid black; ' +
            'box-sizing:  border-box; ' +
            'position: absolute; ' +
            'background: #B7C4B8; ' +
            'cursor: default;' +
            '-webkit-user-select: none; ' +
            '-moz-user-select: none; ' +
            '-ms-user-select: none; ' +
            'user-select: none; ' +
            'box-shadow: -2px 2px 15px rgba(0,0,0,0.5);}' +
            '' +
            '#' + component.id + ' .playground {' +
            'height: 100%;' +
            'float: left;}' +
            '' +
            '#' + component.id + ' .clearfix{' +
            'clear: both;}' +
            '' +
            '#' + component.id + ' .playground table{' +
            'width: 100%;' +
            'height: 100%;' +
            'border: solid black;' +
            'border-collapse: separate;}' +
            '' +
            '#' + component.id + ' .playground table td, #' + component.id + ' .info table td{' +
            'box-sizing:  border-box;}' +
            '' +
            '#' + component.id + ' .playground .b-checked, #' + component.id + ' .info .b-checked	{' +
            'background: black;' +
            'outline: solid #B1BDB2;}' +
            '' +
            '#' + component.id + ' .playground .b-clear, #' + component.id + ' .info .b-clear{' +
            'background: #B1BDB2;' +
            'outline: solid #B7C4B8;}' +
            '' +
            '#' + component.id + ' .info {' +
            'height: auto;' +
            'float: left;}' +
            '' +
            '#' + component.id + ' .info table{' +
            'float: right;' +
            'border-collapse: separate;' +
            'box-sizing:  border-box;}' +
            '' +
            '#' + component.id + ' .info .score{' +
            'text-align: right;}' +
            '' +
            '#' + component.id + ' .info .game-over{' +
            'font-weight: bold;' +
            'color: #B1BDB2;' +
            'clear: both;}' +
            '' +
            '#' + component.id + ' .info .pause a{' +
            'text-decoration: none;' +
            'color: black;}' +
            '' +
            '#' + component.id + ' .corner{' +
            'border: 7px solid transparent;' +
            'border-right: 7px solid gray;' +
            'border-bottom: 7px solid gray;' +
            'width: 0;' +
            'height: 0;' +
            'position: absolute; ' +
            'bottom: 0;' +
            'right: 0;';

        document.getElementsByTagName('head')[0].appendChild(style);
    }

    // Генерация DOM для скелета компонента
    function createElements() {
        var playground = document.createElement('div');
        playground.className = "playground";

        var info = document.createElement('div');
        info.className = "info";

        var clearfix = document.createElement('div');
        clearfix.className = "clearfix";

        var score = document.createElement('div');
        score.className = "score";

        var corner = document.createElement('div');
        corner.className = "corner";

        var gameOver = document.createElement('div');
        gameOver.className = "game-over";
        gameOver.id = "gameover-id";
        gameOver.innerText = 'GAME OVER';

        var text = document.createElement('div');
        text.className = "text";
        text.innerText = 'SCORE';

        var text2 = document.createElement('div');
        text2.className = "text";
        text2.innerText = 'HI SCORE';

        var text3 = document.createElement('div');
        text3.className = "text";
        text3.innerText = 'SPEED';

        var textScore = document.createElement('div');
        textScore.className = "text-score";
        textScore.id = "score-id";
        textScore.innerText = '00000000';

        var textScore2 = document.createElement('div');
        textScore2.className = "text-score";
        textScore2.id = "hiscore-id";
        textScore2.innerText = '0000000';

        var textScore3 = document.createElement('div');
        textScore3.className = "text-score";
        textScore3.id = "speed-id";
        textScore3.innerText = '0';

        var pause = document.createElement('div');
        pause.className = "pause";
        pause.innerHTML = 'PAUSE';


        var i, j;
        var grid = document.createElement('table');
        for (i = rows; i > 0; i--) {
            row = document.createElement('tr');
            grid.appendChild(row);
            for (j = 1; j <= cols; j++) {
                col = document.createElement('td');
                col.className = "b-clear";
                row.appendChild(col);
            }
        }

        var infoGrid = document.createElement('table');
        for (i = 4; i > 0; i--) {
            var row = document.createElement('tr');
            infoGrid.appendChild(row);
            for (j = 1; j <= 4; j++) {
                var col = document.createElement('td');
                col.className = "b-clear";
                row.appendChild(col);
            }
        }

        component.appendChild(playground);
        component.appendChild(info);
        component.appendChild(clearfix);
        playground.appendChild(grid);
        info.appendChild(score);
        info.appendChild(corner);
        score.appendChild(infoGrid);
        score.appendChild(gameOver);
        score.appendChild(text);
        score.appendChild(textScore);
        score.appendChild(text2);
        score.appendChild(textScore2);
        score.appendChild(text3);
        score.appendChild(textScore3);
        score.appendChild(pause);
    }

    // Расчитывает все "расмерные" свойства CSS и меняет их
    function drawAll() {
        var arr, arr_length, i, tmp_size, element, brickWidth;

        // component
        component.style.width = currentMeasures.width + 'px';
        component.style.height = currentMeasures.height + 'px';
        component.style.left = currentMeasures.left + 'px';
        component.style.top = currentMeasures.top + 'px';

        // .playground
        component.querySelector('.playground').style.width = pgPercentage + "%";

        // .playground table
        var table = component.querySelector('.playground table');
        table.style.borderWidth = getPlaygroundBorder() + 'px';
        table.style.borderSpacing = getPlaygroundSpacing() + 'px';
        arr = component.querySelectorAll('.playground td');
        arr_length = arr.length;
        for (i = 0; i < arr_length; i++) {
            arr[i].style.outlineWidth = getPlaygroundSpacing() + 'px';
            arr[i].style.outlineOffset = -getCubeOutlineWidth() + 'px';
        }

        // .info
        component.querySelector('.info').style.width = (100 - pgPercentage) + "%";

        // .info table
        component.querySelector('.info table').style.borderSpacing = getPlaygroundSpacing() + 'px';

        // .info .score
        component.querySelector('.info .score').style.padding = 1 + getPlaygroundBorder() + 'px';

        // .info .game-over
        element = component.querySelector('.info .game-over');
        tmp_size = (currentMeasures.width * (100 - pgPercentage) / 100) / 2.4;
        element.style.fontSize = tmp_size + 'px';
        element.style.paddingTop = tmp_size / 7 + 'px';
        element.style.paddingRight = tmp_size / 7 + 'px';
        element.style.margin = tmp_size / 2 + 'px 0';

        // .info .text-score
        arr = component.querySelectorAll('.info .text-score');
        tmp_size = (currentMeasures.width * (100 - pgPercentage) / 100) / 4.5;
        arr_length = arr.length;
        for (i = 0; i < arr_length; i++) {
            arr[i].style.fontSize = tmp_size + 'px';
            arr[i].style.marginBottom = tmp_size / 1 + 'px';
        }

        // .info .text
        arr = component.querySelectorAll('.info .text');
        tmp_size = (currentMeasures.width * (100 - pgPercentage) / 100) / 7.4;
        arr_length = arr.length;
        for (i = 0; i < arr_length; i++) {
            arr[i].style.fontSize = tmp_size + 'px';
        }

        // .info .pause
        element = component.querySelector('.info .pause');
        tmp_size = (currentMeasures.width * (100 - pgPercentage) / 100) / 5.0;
        element.style.fontSize = tmp_size + 'px';
        element.style.margin = tmp_size + 'px 0 0 0';
        if (modes.pauseMode) {
            element.style.fontWeight = "bold";
        } else {
            element.style.fontWeight = "normal";
        }

        // .info table td
        arr = component.querySelectorAll('.info table td');
        arr_length = arr.length;
        brickWidth = getBrickWidth();
        for (i = 0; i < arr_length; i++) {
            arr[i].style.outlineWidth = getPlaygroundSpacing() + 'px';
            arr[i].style.outlineOffset = -getCubeOutlineWidth() + 'px';
            arr[i].style.width = brickWidth + 'px';
            arr[i].style.height = brickWidth + 'px';
        }

        // corner
        element = component.getElementsByClassName('corner')[0];
        if (modes.fullScreen) {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }

    function assignEvents() {
        /*RESISE*/
        // desktop
        window.addEventListener('mousedown', screenModule.reSizeDownMouse);
        window.addEventListener('mousemove', screenModule.reSizeMove);
        window.addEventListener('mouseup', screenModule.reSizeUp);

        /*MOVE*/
        // desktop
        window.addEventListener('mousedown', screenModule.moveDownMouse);
        window.addEventListener('mousemove', screenModule.moveMouse);
        window.addEventListener('mouseup', screenModule.moveUpMouse);

        /*OTHER*/
        window.addEventListener('dblclick', screenModule.setFullScreen);
        window.addEventListener('keydown', screenModule.setNormalScreen);
        //window.addEventListener('keydown', screenModule.setPause);
        window.addEventListener('resize', screenModule.reDrawOnResize);
    }

    // Определение реальной ширины окна браузера
    function getRealDocumentWidth() {
        return Math.max(
            document.body.scrollWidth, document.documentElement.scrollWidth,
            document.body.offsetWidth, document.documentElement.offsetWidth,
            document.body.clientWidth, document.documentElement.clientWidth
        );
    }

    // Определение реальной высоты окна браузера
    function getRealDocumentHeight() {
        return Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
    }

    // Отрабатывает при нажатии левой кнопки мыши для режима "Resize"
    function reSizeDownMouse(e) {
        if (e.target.className === 'corner') {
            var coords = component.getBoundingClientRect();
            measuresOnClick.x = e.pageX;
            measuresOnClick.y = e.pageY;
            measuresOnClick.top = component.offsetTop;
            measuresOnClick.left = component.offsetLeft;
            measuresOnClick.right = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft) + coords.right;
            measuresOnClick.bottom = Math.max(document.documentElement.scrollTop, document.body.scrollTop) + coords.bottom;
            measuresOnClick.flag = true;
        }
    }

    // Отрабатывает при изменении курсором мыши размера объекта в режиме "Resize"
    function reSizeMove(e) {
        if (measuresOnClick.flag) {
            currentMeasures.width = measuresOnClick.right - measuresOnClick.left + Math.max((e.pageX - measuresOnClick.x), (e.pageY - measuresOnClick.y) / k);
            currentMeasures.height = measuresOnClick.bottom - measuresOnClick.top + Math.max((e.pageY - measuresOnClick.y), (e.pageX - measuresOnClick.x) * k);
            if (crossBorders()) {
                currentMeasures.width = measuresOnClick.right - measuresOnClick.left + Math.min((currentMeasures.clientWidth - measuresOnClick.right), (currentMeasures.clientHeight - measuresOnClick.bottom) / k) - 5;
                currentMeasures.height = measuresOnClick.bottom - measuresOnClick.top + Math.min((currentMeasures.clientHeight - measuresOnClick.bottom), (currentMeasures.clientWidth - measuresOnClick.right) * k) - 5;
            }

            setWidth(currentMeasures.width);
            setHeight(currentMeasures.height);
            drawAll();
        }
    }

    // Отрабатывает при отпускании левой кнопки мыши в режиме "Resize"
    function reSizeUp() {
        if (measuresOnClick.flag) {
            measuresOnClick.flag = false;
        }
    }

    // Отрабатывает при нажатии левой кнопки мыши для режима "перемещения"
    function moveDownMouse(e) {
        // Это для "хрома" защита (теряет событие "mouseup" при выходе курсора за пределы окна)
        if (component.contains(e.target)) {
            document.body.style['-webkit-user-select'] = 'none';
            document.body.style['-moz-user-select'] = 'none';
            document.body.style['-ms-user-select'] = 'none';
            document.body.style['user-select'] = 'none';
        }

        // Если клик на нашем объекте + не по уголку(resize) + не в режиме fullscreen
        if (component.contains(e.target) && (e.target.className !== 'corner') && !modes.fullScreen) {
            modes.dragAndDropMode = true;
            moveDownMouse.delta_left = e.pageX - component.offsetLeft;
            moveDownMouse.delta_top = e.pageY - component.offsetTop;
        }
    }

    // Вернет true при попытке пересечь границы окна браузера
    function crossBorders() {
        var result = false;

        if (currentMeasures.clientWidth < (currentMeasures.left + currentMeasures.width + 5)) {
            result = true;
        }
        if (currentMeasures.clientHeight < (currentMeasures.top + currentMeasures.height + 5)) {
            result = true;
        }

        if (currentMeasures.left < 5) {
            result = true;
        }

        if (currentMeasures.top < 5) {
            result = true;
        }

        return result;
    }

    // Отрабатывает при перемещении объекта по экрану (левая кнопка мыши зажата)
    function moveMouse(e) {
        if (modes.dragAndDropMode) {
            currentMeasures.left = e.pageX - moveDownMouse.delta_left;
            currentMeasures.top = e.pageY - moveDownMouse.delta_top;
            if (crossBorders()) {
                currentMeasures.left = Math.min(currentMeasures.clientWidth - currentMeasures.width - 5, currentMeasures.left);
                currentMeasures.left = Math.max(5, currentMeasures.left);
                currentMeasures.top = Math.min(currentMeasures.clientHeight - currentMeasures.height - 5, currentMeasures.top);
                currentMeasures.top = Math.max(5, currentMeasures.top);
            }
            component.style.left = currentMeasures.left + 'px';
            component.style.top = currentMeasures.top + 'px';
        }
    }

    // Отрабатывает при отпускании левой кнопки мыши в режиме "перемещения"
    function moveUpMouse() {
        // Это для хрома защита (теряет событие "mouseup" при выходе курсора за пределы окна)
        document.body.style['-webkit-user-select'] = 'all';
        document.body.style['-moz-user-select'] = 'all';
        document.body.style['-ms-user-select'] = 'all';
        document.body.style['user-select'] = 'all';
        modes.dragAndDropMode = false;
    }

    // Запускает режим fullScreen
    function setFullScreen(e) {
        // Не реагировать, если двойной клик по кнопке PAUSE
        //if (e.target === component.querySelector('.info .pause a')) {
        //    return;
        //}

        if (component.contains(e.target)) {
            if (!modes.fullScreen) {
                // Сохраняем текущие координаты и размеры
                var coords = component.getBoundingClientRect();
                modes.fullScreen = true;
                setFullScreen.width = currentMeasures.width;
                setFullScreen.height = currentMeasures.height;
                setFullScreen.left = coords.left;
                setFullScreen.top = coords.top;

                // Разворачиваем
                var shadow_bg = document.createElement('div');
                setFullScreen.shadow_bg = shadow_bg;
                shadow_bg.setAttribute("id", "shadow_bg_14");
                shadow_bg.style.background = 'black';
                shadow_bg.style.opacity = 0.5;
                shadow_bg.style.position = 'absolute';
                shadow_bg.style.top = 0;
                shadow_bg.style.left = 0;
                shadow_bg.style.width = currentMeasures.clientWidth + 'px';
                shadow_bg.style.height = currentMeasures.clientHeight + 'px';
                document.body.style.overflow = 'hidden';
                component.parentElement.insertBefore(shadow_bg, component);
                drawFullScreen();
            }
        }
    }

    // Пересчитывает все размеры объекта для режима FullScreen и "перерисовывает их"
    function drawFullScreen() {
        var margins = 20; // отступы сверху-снизу
        var height = document.documentElement.clientHeight - getComputedStyle(document.body).marginTop.slice(0, -2) - 2 * margins;
        var width = height / k;
        modes.dragAndDropMode = false;
        setWidth(width);
        setHeight(height);
        drawAll();
        // центрируем
        component.style.left = currentMeasures.clientWidth / 2 - currentMeasures.width / 2 + 'px';
        component.style.top = Math.max(document.documentElement.scrollTop, document.body.scrollTop) + margins + 'px'; //
        modes.fullScreen = true;
        // Меняем размеры тёмной зоны
        resizeShadow(currentMeasures.clientWidth, currentMeasures.clientHeight)
    }

    // Возвращает сохранённые размеры до использования FullScreen и "перерисовывает" объект
    function setNormalScreen(e) {
        if (e.keyCode === 27) {
            if (modes.fullScreen) {
                var width = setFullScreen.width;
                var height = setFullScreen.height;
                component.style.left = setFullScreen.left + 'px';
                component.style.top = setFullScreen.top + 'px';
                modes.fullScreen = false;
                setWidth(width);
                setHeight(height);
                drawAll();
                document.body.style.overflow = 'auto';
                setFullScreen.shadow_bg.parentNode.removeChild(setFullScreen.shadow_bg);
            }
        }
    }

    // Отработка "паузы"
    function setPause(e){
        var element = component.querySelector('.info .pause');
        if (e) {
            element.style.fontWeight = "bold";
        } else {
            element.style.fontWeight = "normal";
        }
    }

    function collapseShadow() {
        var element = document.getElementById("shadow_bg_14");
        if (element) {
            element.style.width = 0;
            element.style.height = 0;
        }
    }

    function resizeShadow(width, height) {
        var element = document.getElementById("shadow_bg_14");
        if (element) {
            element.style.width = width + 'px';
            element.style.height = height + 'px';
        }
    }

    // Перерисовать объект при изменении размера экрана
    function reDrawOnResize() {
        // Схлопываем зону тени, чтобы она не влияла на оценку размера документа
        collapseShadow();

        // Сохраняем новые размеры окна браузера
        currentMeasures.clientWidth = getRealDocumentWidth();
        currentMeasures.clientHeight = getRealDocumentHeight();
        if (modes.fullScreen) {
            drawFullScreen();
        } else {
            if (crossBorders()) {
                currentMeasures.left = Math.min(currentMeasures.clientWidth - currentMeasures.width - 5, currentMeasures.left);
                currentMeasures.left = Math.max(5, currentMeasures.left);

                currentMeasures.top = Math.min(currentMeasures.clientHeight - currentMeasures.height - 5, currentMeasures.top);
                currentMeasures.top = Math.max(5, currentMeasures.top);
            }
            component.style.left = currentMeasures.left + 'px';
            component.style.top = currentMeasures.top + 'px';
        }
    }

    function fillPlaygroundByBricks(arr) {
        if (!Array.isArray(arr)) {
            arr = arr.split('');
        }

        var tr = component.querySelectorAll('.playground table tr');
        var i, c, r = rows - 1;
        for (i = 0; i < arr.length; i++) {
            c = i % cols;
            if ((c === 0) && (i > 0)) {
                r--;
            }
            if ((r === -1) && (c === 0)) {
                break;
            }
            var td = tr[r].querySelectorAll('td')[c];
            if (+arr[i] === 1) {
                td.classList.remove('b-clear');
                td.classList.add('b-checked');
            } else {
                td.classList.remove('b-checked');
                td.classList.add('b-clear');
            }
        }
    }


    function showInNextField(figure) {
        if (!Array.isArray(figure)) {
            figure = figure.split('');
        }

        var tr = component.querySelectorAll('.info table tr');
        var i, c, r = 4 - 1;
        for (i = 0; i < figure.length; i++) {
            c = i % 4;
            if ((c === 0) && (i > 0)) {
                r--;
            }
            if ((r === -1) && (c === 0)) {
                break;
            }
            var td = tr[r].querySelectorAll('td')[c];
            if (+figure[i] === 1) {
                td.classList.remove('b-clear');
                td.classList.add('b-checked');
            } else {
                td.classList.remove('b-checked');
                td.classList.add('b-clear');
            }
        }
    }

    function setScore(value){
      document.getElementById("score-id").firstChild.nodeValue = value;
    }
    function setHiScore(value){
        document.getElementById("hiscore-id").firstChild.nodeValue = value;
    }
    function setSpeed(value){
        document.getElementById("speed-id").firstChild.nodeValue = value;
    }

    function setGameOver(){
      document.getElementById("gameover-id").style.color = "black";

    }

    // Список методов, видимых "снаружи"
    return {
        setup: setupNewComponent,
        reSizeDownMouse: reSizeDownMouse,
        reSizeMove: reSizeMove,
        reSizeUp: reSizeUp,
        moveDownMouse: moveDownMouse,
        moveMouse: moveMouse,
        moveUpMouse: moveUpMouse,
        setNormalScreen: setNormalScreen,
        setFullScreen: setFullScreen,
        setPause: setPause,
        reDrawOnResize: reDrawOnResize,
        fillPlaygroundByBricks: fillPlaygroundByBricks,
        showInNextField: showInNextField,
        setScore: setScore,
        setHiScore: setHiScore,
        setSpeed: setSpeed,
        setGameOver: setGameOver
    };
})();
