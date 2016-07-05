/** Created by Nazaki on 14.04.2016 **/
"use strict";

// Модуль игры "Тетрис"
var romTetris =(function(){
	var cols, // ширина игрового поля
		rows, // высота игрового поля
		matrix, // обьект "матрица игрового поля"
		figure, // текущая фигура
		listOfFigures = [], // массив фигур
		figureNext, // id следующей фигуры
		timerId,
		paused = false,
		score = 0,
		temp = 1,
		hiscore = localStorage.getItem('hiscore') || 0;

    // Конструктор матрицы
    function CreateMatrix(){
        // Создаём пустую матрицу
        var a = [];
        a.length = rows * cols + 1;
        this.db = a.join('0').split('');

        // Экспортировать матрицу в виде строки
        this.exportScreen = function(){return this.db.slice()};

        // Импортировать матрицу из строки
        this.setDb = function(txt){
            this.db = txt.split('');
        };
        // Получить значение ячейки
        this.getCell = function (row, col){
            return this.db[row*cols + col];
        };
        // Получить значение строки (массив)
        this.getRow = function (row){
            var result = [], i;
            for (i = 0; i <  cols; i++ ){
                result.push(this.getCell(row, i));
            }
            return result;
        };
        // Установить значение ячейки
        this.setCell = function (row, col, value){
            if ((col <= cols-1) && (row <= rows-1)) {
                this.db[row*cols + col] = +value;
            }
        };
        // Установить значение строки (из массива)
        this.setRow = function(row, arr){
            var i;
            if ((row >= 0) && (row <= rows-1)) {
                for (i = 0; i <= cols; i++){
                    this.setCell(row, i, (arr[i] !== undefined)? arr[i]:this.getCell(row,i));
                }
            }
        }
    }

    // Подключение компонента интерфейса
	function startGame(settings){
		cols = settings.cols;
		rows = settings.rows;

		// Подключаем игровой экран
		screenModule.setup(settings);

		// Создаём чистую "матрицу"
		matrix = new CreateMatrix();

		// Счет
		screenModule.setScore(score);

		// Рекорд
		screenModule.setHiScore(hiscore);

		// Скорость
		screenModule.setSpeed(temp);

		// Классичесике фигуры
		addNewFigure('0000011001000100'.split('')); // L правая
		addNewFigure('0000011000100010'.split('')); // L левая
		addNewFigure('0000001101100000'.split('')); // z левая
		addNewFigure('0000011000110000'.split('')); // z правая
		addNewFigure('0000011001100000'.split('')); // кубик
		addNewFigure('0000011100100000'.split('')); // T
		addNewFigure('0010001000100010'.split('')); // палочка

		// Дополнительные фигуры
		if (settings.extra) {
			addNewFigure('0001011101000000'.split('')); // Z правый
			addNewFigure('0000000101110100'.split('')); // Z левый
			addNewFigure('0100011101000000'.split('')); // T
			addNewFigure('0000010001000000'.split('')); // малая палочка
			addNewFigure('0000001000100010'.split('')); // средняя палочка
			addNewFigure('1111100010001000'.split('')); // большой угол
			addNewFigure('0000011101000100'.split('')); // средний угол
			addNewFigure('0000011001000000'.split('')); // малый угол
			addNewFigure('0000011001000110'.split('')); // скоба
			addNewFigure('0000001001110010'.split('')); // крест
			addNewFigure('0000001011110010'.split('')); // крест большой
			addNewFigure('0000000000100000'.split('')); // пиксель
			addNewFigure('0000010001100011'.split('')); // М
			addNewFigure('0100010001100100'.split('')); // полицейская палка левая
			addNewFigure('0010001001100010'.split('')); // полицейская палка правая
			addNewFigure('0000010101110101'.split('')); // Н
			addNewFigure('0000011000110010'.split('')); // уточка левая
			addNewFigure('0000001101100010'.split('')); // уточка правая
		}

		// Подключаем обработку нажатый клавиш
		window.addEventListener('keydown', romTetris.move);

		// Запускаем вступление
		var logoBG = '00000000000000000000000111111000110011100110000110011000111101100000000110000000001100011000011111100000000000111111100001100011000110011100011111000001100111000110001100111111100000000000000000000000',
			logoTetris = '11111111111111111111000000000010010101111001010001111001001110110001101001010100111000011100000000000001111000010100001001011110100101000010010111101001000000101111001111000000000011111111111111111111',
			delay;

		// Запускаем фигуру
		if ((cols === 10) && (rows === 20)) {
			delay = intro(logoBG, logoTetris);
		} else {delay = 0;}
		setTimeout(function () {
			startNewFigureSession();
		}, delay);

	}


	// Общая функция обработки события нажания клавиши с клавиатуры
	function move(e){
		if (!figure){
				return;
		}

		// Pause
		if (e.keyCode === 19) {
			if (!paused){
				paused = true;
				screenModule.setPause(true);
				if (timerId) {
					clearTimeout(timerId);
				}
			} else {
				paused = false;
				screenModule.setPause(false);
			startTimer();
			}
		}

		if (!paused){
			var tmpScreen;

			// Стрелочка вверх (поворот фигуры)
			if (e.keyCode === 38) {
				if (checkRotate()){
					figure.rotate();
					// Смешиваем фигуру с матрицей
					tmpScreen = mixMatrixAndFigure(matrix, figure);
					// Результат отправляем на экран
					screenModule.fillPlaygroundByBricks(tmpScreen);
				}
			}

			// Стрелочка влево
			if (e.keyCode === 37) {
				if (checkLeft()){
					figure.left();
					// Смешиваем фигуру с матрицей
					tmpScreen = mixMatrixAndFigure(matrix, figure);
					// Результат отправляем на экран
					screenModule.fillPlaygroundByBricks(tmpScreen);
				}
			}

			// Стрелочка вправо
			if (e.keyCode === 39) {
				if (checkRight()){
					figure.right();
					// Смешиваем фигуру с матрицей
					tmpScreen = mixMatrixAndFigure(matrix, figure);
					// Результат отправляем на экран
					screenModule.fillPlaygroundByBricks(tmpScreen);
				}
			}

			// Стрелочка вниз
			if (e.keyCode === 40) {
				if (checkDown()){
					figure.down();
					// Смешиваем фигуру с матрицей
					tmpScreen = mixMatrixAndFigure(matrix, figure);
					// Результат отправляем на экран
					screenModule.fillPlaygroundByBricks(tmpScreen);
				} else {
					tmpScreen = mixMatrixAndFigure(matrix, figure);
					matrix.setDb(tmpScreen.join(''));

					// Срезать сплошные
					score += cutCompleteRows();
					temp = 1 + Math.floor(score/200);
					screenModule.setSpeed(temp);

					// Обновить счет
					screenModule.setScore(score);

					// Проверить на "конец игры"
					if (!ifGameOver()){
						// Запустить новую сессию
						startNewFigureSession();
					} else {
						hiscore = Math.max(score||hiscore);
						localStorage.setItem('hiscore', hiscore);
						screenModule.setHiScore(hiscore);
						figure = undefined;
						screenModule.setGameOver();

						// Поднимаем шторку (эффект)
						var i, delay, r, tempo;
						for (i = 0; i < rows; i++) {
							r = new Array(cols+1).join('1').split('');
							tempo = 50;
							matrix.setRow(i, r);
							delay =  i * tempo;
							execute(matrix.exportScreen(), delay);
						}
					}
				}
			}
		}
	}

	// Проверяет, не заполнена ли последняя строка
	function ifGameOver(){
	 var i, result = false;
	  for (i = 0; i < cols; i++){
		if (getCell(matrix.db, cols, rows-1, i) === '1'){
			result = true; 
		}
	  }
		return result;
	}


	// Проверяет, можно ли повернуть фигуру на текущей поле позиции в игровом поле
	function checkRotate(){
		var result = true,  x, y, xx, yy, obj,
			_db =  new Array(4*4+1).join('0').split('');
			for (y = 0; y < figure.height; y++){
				for (x = 0; x < figure.width; x++){
					yy = figure.width  - x;
					xx = y;
					_db[yy*4 + xx] = figure.db[y*4 + x];
				}
			}
			obj = prepareCurrent(_db);
	        for (y = 0; y < obj.height; y++){
                for (x = 0; x < obj.width; x++){
				    if ( getCell(matrix.db, cols, figure.point.y + y, figure.point.x + x) == '1' && getCell(obj.db, 4, y, x) == '1'){
			            result = false;
		            }
		        if (figure.point.x + x >= cols){
			        result = false;
		        }
			}
		}
	    return result;
	}

    // Проверяет, можно ли сдвинуть фигуру вниз на текущей поле позиции в игровом поле
    function checkLeft(){
	    var result = true, x, y;
        for (y = 0; y < figure.height; y++){
            for (x = 0; x < figure.width; x++){
                if ( getCell(matrix.db, cols, figure.point.y + y, figure.point.x-1 + x) == '1' && getCell(figure.db, 4, y, x) == '1'){
                    result = false;
                }
                if (figure.point.x-1 + x < 0){
                    result = false;
                }
            }
        }
        return result;
    }

    // Проверяет, можно ли сдвинуть фигуру вправо на текущей поле позиции в игровом поле
	function checkRight(){
	    var result = true, x, y;
	    for (y = 0; y < figure.height; y++){
		    for (x = 0; x < figure.width; x++){
				if ( getCell(matrix.db, cols, figure.point.y + y, figure.point.x + x+1) == '1' && getCell(figure.db, 4, y, x) == '1'){
			        result = false;
		        }
		        if (figure.point.x+1 + x >= cols){
			        result = false;
		        }
			}
		}
		return result;
	}

    // Проверяет, можно ли сдвинуть фигуру вниз на текущей поле позиции в игровом поле
	function checkDown(){
	    var result = true, x, y;
	        for (y = 0; y < figure.height; y++){
		        for (x = 0; x < figure.width; x++){
				    if ( getCell(matrix.db, cols, figure.point.y + y-1, figure.point.x + x) == '1' && getCell(figure.db, 4, y, x) == '1'){
			        result = false;
		        }
		        if (figure.point.y-1 + y < 0){
			        result = false;
		        }
			}
		}
		return result;
    }

	// отправить DB на экран через Х мс
	function execute(db, sec){
		(function(db, sec) {
			setTimeout(function () {
				screenModule.fillPlaygroundByBricks(db);
			}, sec);
		})(db, sec);
	}

	// Получить значение ячейки из логотипа
	function getCellFromLogo (logo, row, col){
		return logo[row*cols + col];
	}

	// Получить значение строки (массив) из логотипа
	function getRowFromLogo(logo, row){
		var result = [], i;
		for (i = 0; i <  cols; i++ ){
			result.push(getCellFromLogo(logo, row, i));
		}
		return result;
	}


	// Вступительный ролик
	function intro(logo, logo2) {
		var i, j, r, delay, predelay, clear, blackScreen, blackScreenLength,
            arr = [],
		    tempo = 20;

        arr.length = cols + 1;
		r = arr.join('1').split('');
		// Опускаем занавес
		for (i = 0; i < rows; i++) {
			matrix.setRow(rows - i - 1, r);
			delay = 500 + i * tempo;
			execute(matrix.exportScreen(), delay);
		}
		predelay = delay;

		// Поднимаем занавес (оставляем лого)
		for (i = rows - 1; i >= 0; i--) {
			r = getRowFromLogo(logo, rows - i - 1);
			matrix.setRow(rows - i - 1, r);
			delay = (rows - i) * tempo;
			execute(matrix.exportScreen(), predelay + delay);
		}
		predelay = predelay + delay + 1000;

		// замыкаем створки по бокам
		for (j = 0; j < cols/2; j++) {
			for (i = 0; i < rows; i++) {
				r = matrix.getRow(i);
					r[j]= '1';
					r[cols-1 - j]= '1';
				matrix.setRow(i, r);
				delay =   j*tempo*3;
				execute(matrix.exportScreen(), predelay + delay);
			}
		}
		predelay = predelay + delay+100;

		// разъезд половинок вверх/вниз одновременно
		for (i = 0; i < rows; i++) {
			r = getRowFromLogo(logo2, rows - i - 1);
			for (j=0; j < cols/2; j++){
				matrix.setCell(rows - i - 1, j, r[j]);
			}
			r = getRowFromLogo(logo2, i);
			for (j=cols/2; j < cols; j++){
				matrix.setCell(i, j, r[j]);
			}
			delay = i * tempo;
			execute(matrix.exportScreen(), predelay + delay);
		}
		predelay = predelay + delay + 1000;

		// замыкаем створки по бокам
		for (j = 0; j < cols/2; j++) {
			for (i = 0; i < rows; i++) {
				r = matrix.getRow(i);
				r[j]= '1';
				r[cols-1 - j]= '1';
				matrix.setRow(i, r);
				delay =   j*tempo*3;
				execute(matrix.exportScreen(), predelay + delay);
			}
		}
		predelay = predelay + delay+100;

		clear = false;
		blackScreen = matrix.exportScreen();
		blackScreenLength = blackScreen.length;
		j = 0;
		while (!clear){
			j++;
			clear = true;
			for (i = 0; i < blackScreenLength; i++){
				if (blackScreen[i] === 1){
					clear = false;
					blackScreen[i] = (Math.random() < 0.4)?0:1;
				}
			}
			matrix.setDb(blackScreen.join(''));
			delay = j*tempo*2;
			execute(matrix.exportScreen(), predelay + delay);

		}
    return predelay + delay;
	}

	// Добавить новую фигуру в базу игры
	function addNewFigure(figure){
		listOfFigures.push(figure);
	}

	// Конструктор создания активной фигуры по ее ID
	function FigureFactory(id){
		var db = listOfFigures[id],
		    obj = prepareCurrent(db);
		
		this.id = id;
		this.db = obj.db;
		this.width = obj.width;
		this.height = obj.height;
		this.point = {};
		this.point.x = Math.round(cols/2) - Math.round(this.width/2);
		this.point.y = rows - this.height;
	    this.rotate = function(){
			var x, y, xx, yy,
			_db =  new Array(4*4+1).join('0').split('');
			for (y = 0; y < this.height; y++){
				for (x = 0; x < this.width; x++){
					yy = this.width-1  - x;
					xx = y;
					_db[yy*4 + xx] = this.db[y*4 + x];
				}
			}
			var obj = prepareCurrent(_db);
			this.db = obj.db;
			this.width = obj.width;
			this.height = obj.height;

			if (obj.height + this.point.y > rows){
				this.point.y = rows - obj.height;
			}
		};

        this.left = function(){
            this.point.x--;
        };

	    this.right = function(){
		    this.point.x++;
	    };

	    this.down = function(){
		    this.point.y--;
	    };
	}


	// Получить значение ячейки
	function getCell (db, width, row, col){
		if (!Array.isArray(db)){
			db = db.split('');
		}
		if ((col >= 0) && (col < width) && (row >= 0) && (row < db.length/width)){
			return db[row * width + col];
		}
	}

	// Установить адрес ячейки
	function GetCellAddress (width, row, col){
		return width  * row + col;
	}


    // Случайное целое число из диапазона
	function randomInteger(min, max) {
		var rand = min + Math.random() * (max + 1 - min);
		rand = Math.floor(rand);
		return rand;
	}

    // Запустить новую сессию для фигуры
	function startNewFigureSession(){
        var id, tmpScreen;
		// Создаем новую фигуру
	    if (figureNext === undefined ){
  	        figureNext = randomInteger(0, listOfFigures.length - 1);
	    }
	    id = figureNext;
	        figureNext = randomInteger(0, listOfFigures.length - 1);
	        screenModule.showInNextField(listOfFigures[figureNext]);
	        figure = new FigureFactory(id);

	    // Смешиваем фигуру с матрицей
	    tmpScreen = mixMatrixAndFigure(matrix, figure);
	
	    // Результат отправляем на экран
	    screenModule.fillPlaygroundByBricks(tmpScreen);
        if (timerId) {
            clearTimeout(timerId);
        }
        startTimer();
	}

    // Запустить таймер
	function startTimer(){
	   timerId =	setInterval(function(){ 
			var e = {
				keyCode: 40
			};
			move(e);
       }, 1000/temp);
	}


	// Позвращает игровой экран, смешанный с текущей позицией фигуры
    function mixMatrixAndFigure(matrix, figure){
	var x,y,matrixPos,figurePos,
	matrixDb = matrix.db.slice(0);
	for (y = 0; y < 4; y++){
		for (x = 0; x < 4; x++){
		matrixPos = GetCellAddress(cols,  figure.point.y + y, figure.point.x + x);
		figurePos = GetCellAddress(4,  y, x);
				matrixDb[matrixPos] = +matrixDb[matrixPos] || +figure.db[figurePos];
			}
		}
	return matrixDb;	
	}

    // Вырезать "собранные" строку
    function cutCompleteRows(){
        var count = 0, tmpScreen, bricks, x,y,i,j,len, arr = [];
            for (y = 0; y < rows; y++){
                bricks = 0;
                for (x = 0; x < cols; x++){
                    bricks += +matrix.db[cols * y + x];
                }
                if (bricks === cols){
                    arr.push(y);
                count += 10;
	            }
            }
        // Отбеливаем с верху вниз
        len = arr.length;
        for (i = 0; i < cols; i++){
            for (j = len-1; j >= 0; j--){
                (function(x,y){
                    setTimeout(function(){
                                    matrix.db[cols * arr[y] + x] = '0';
                                    tmpScreen = mixMatrixAndFigure(matrix, figure);
                                    if (x === cols-1){
                                        matrix.db.splice(arr[y]*cols, cols);
                                        tmpScreen = mixMatrixAndFigure(matrix, figure);
                                    }
                                    screenModule.fillPlaygroundByBricks(tmpScreen);
                                }, x*30 - arr[y]*5)
                })(i,j)
            }
        }

        // Добиваем пустыми строками сверху
        var arrTmp = new Array(len*cols+1).join('0').split('');
        matrix.db = matrix.db.concat(arrTmp);
        return count;
    }

	// Смещение фигуры в левый нижний край относительно мастрицы фигуры и определение ее размеров (высота и ширина)
	function prepareCurrent(db){
		var  dim = {
				x: {
					min: 4,
					max: -1
				},
				y: {
					min: 4,
					max: -1
				}
			},
			x, y, tmp,
			result  = {};

		// Создаём пустую матрицу для фигуры
		result.db =  new Array(db.length + 1).join('0').split('');

		// Определяем полюса
		for (y = 0; y < 4; y++) {
			for (x = 0; x < 4; x++){
				tmp = db[y*4 + x];
				if ((tmp === '1') && (dim.x.min > x)){
					dim.x.min = x;
				}
				if ((tmp === '1') && (dim.x.max < x)){
					dim.x.max = x;
				}
				if ((tmp === '1') && (dim.y.min > y)){
					dim.y.min = y;
				}
				if ((tmp === '1') && (dim.y.max < y)){
					dim.y.max = y;
				}
			}
		}

		// Определяем высоту и ширину фигуры
		result.width = dim.x.max - dim.x.min + 1;
		result.height = dim.y.max - dim.y.min + 1;


		// Смещаем в левый нижний угол
		for (y = 0; y < 4; y++) {
			for (x = 0; x < 4; x++){
				tmp = db[y*4 + x];
				if (tmp === '1') {
					result.db[getCurrent(dim.x.min, dim.y.min, x, y)] = '1';
				}
			}
		}
		function getCurrent(deltaX,deltaY,x,y){
			var currentX, currentY, result;
			currentX = x - deltaX;
			currentY = y - deltaY;
			result = currentY*4 + currentX;
			return result;
		}

		return result;
	}

    // Список методов, видимых "снаружи"
	return {
        startGame: startGame,
		move: move
	}
})();



