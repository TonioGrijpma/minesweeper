const CELLSIZE = 20;
const NEIGHBOURS = [[1, 0], [1, 1], [0, 1], [-1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1]];

let game = [];
let unlocked = [];
let flags = [];

let startTime = null;
let timerInterval = null;
let width = 0;
let height = 0;
let mines = 0;
let difficulty = 0; // 0 beginner | 1 intermediate | 2 expert
let isFirstClick = true;
let firstClickLocation = null;
let isGameOver = false;
let lastCellSelected = null;

function init(){
	document.getElementById("game-body").addEventListener("mouseup", onGameMouseUp);
	document.getElementById("game-body").addEventListener("mousemove", onGameMouseMove);
	document.getElementById("difficulty").addEventListener("change", onDifficultyChange);

	// interaction with the smiley button
	document.getElementById("smiley").addEventListener("mousedown", onSmileyMouseDown);
	document.getElementById("smiley").addEventListener("mouseup", onSmileyMouseUp);
	document.getElementById("smiley").addEventListener("mouseleave", onSmileyMouseLeave);

	reload();
}
function onGameMouseUp(ev){
	if(isGameOver){
		return;
	}
	if(isFirstClick){
		startTimer();
	}

	setSmiley("🙂");

	const point = getPointFromEvent(ev);

	check(ev.button, point.x, point.y);

	if(checkFinished()){
		completed();
	}
}
function onGameMouseMove(ev){
	if(ev.buttons != 1){
		return;
	}
	if(isGameOver){
		return;
	}

	const point = getPointFromEvent(ev);
	let cell = getCell(point.x, point.y);

	if(lastCellSelected != null){
		lastCellSelected.classList.remove("button-pressed");
	}

	if(cell == null){
		return;
	}
	if(unlocked[point.y][point.x]){
		return;
	}
	
	setSmiley("😮");
	cell.classList.add("button-pressed");
	lastCellSelected = cell;
}
function onDifficultyChange(ev){
	difficulty = parseInt(ev.currentTarget.value);
	reload();
}
function onSmileyMouseDown(ev){
	if(ev.button != 0){
		return;
	}
	ev.currentTarget.classList.add("button-pressed");
}
function onSmileyMouseLeave(ev){
	ev.currentTarget.classList.remove("button-pressed");
}
function onSmileyMouseUp(ev){
	if(ev.button != 0){
		return;
	}
	onSmileyMouseLeave(ev);
	reload();
}
function checkFinished(){
	for (let i = 0; i < unlocked.length; i++) {
		for (let i2 = 0; i2 < unlocked[i].length; i2++) {
			if(game[i][i2] == 9){
				continue;
			}
			if(!unlocked[i][i2]){
				return false;
			}
		}
	}

	return true;
}
function check(button, x, y){
	if(button == 0){ // left button
		if(unlocked[y][x]){
			return;
		}

		// first click cannot be a bomb
		if(isFirstClick && game[y][x] == 9){
			createGame(mines, width, height);
			check(button, x, y);
		}

		createIcon(x, y);
	
		if(game[y][x] == 0){
			cascade(x, y);
		}
		else if(game[y][x] == 9){
			gameOver();
		}

		isFirstClick = false;
	}
	else if(button == 2){ // right button
		placeFlag(x, y);
	}
}
function placeFlag(x, y){
	if(!flagExist(x,y)){
		if(unlocked[y][x]){
			return;
		}

		createIcon(x, y, 11);
		flags.push({x: x, y: y});
	}else{
		removeFlag(x, y);

		removeOverlay(x, y);
		document.getElementById("game-body").appendChild(createCell(x, y))
		unlocked[y][x] = false;
	}

	setDisplay(true, mines - flags.length);
}
function flagExist(x, y){
	let r = false;

	for (let i = 0; i < flags.length; i++) {
		if(flags[i].x == x && flags[i].y == y){
			r = true
		}
	}

	return r;
}
function removeFlag(x, y){
	for (let i = 0; i < flags.length; i++) {
		if(flags[i].x == x && flags[i].y == y){
			flags.splice(i, 1)
		}
	}
}
function getPointFromEvent(event){
	let x = Math.floor((event.pageX - event.currentTarget.offsetLeft) / CELLSIZE);
	let y = Math.floor((event.pageY - event.currentTarget.offsetTop) / CELLSIZE);

    x = (x < 0) ? 0 : x;
    y = (y < 0) ? 0 : y;

    return {x: x, y: y}
}
function removeOverlay(x, y){
	getCell(x, y).remove();
}
function cascade(x, y){
	for (let i = 0; i < NEIGHBOURS.length; i++) {
		const newX = x + NEIGHBOURS[i][0];
		const newY = y + NEIGHBOURS[i][1];

		if(getValue(newX, newY) == 99){
			continue;
		}
		if(unlocked[newY][newX]){
			continue;
		}

		if(getValue(newX, newY) == 0){
			createIcon(newX, newY);
			cascade(newX, newY);
		}else{
			createIcon(newX, newY);
		}
	}
}
function drawCells(width, height){
	let body = document.getElementById("game-body");

	for (let h = 0; h < height; h++) {
		for (let w = 0; w < width; w++) {
			body.appendChild(createCell(w, h))
		}
	}

	// change the background grid size
	body.style.backgroundSize = `${CELLSIZE + 0.08}px ${CELLSIZE+ 0.05}px`;
}
function createCell(x, y){
	let el = document.createElement("div");

	el.style.height = `${CELLSIZE}px`;
	el.style.width = `${CELLSIZE}px`;
	el.style.left = `${x * CELLSIZE}px`;
	el.style.top = `${y * CELLSIZE}px`;
	el.setAttribute("class", "cell");
	el.setAttribute("id", `${x}-${y}`);
	el.innerHTML = "";

	return el;
}
// < 9 number | 9 exploded bomb | 10 bomb | 11 flag
function createIcon(x, y, value = game[y][x]){
	getCell(x, y).remove();

	if(value != 11){
		unlocked[y][x] = true;
	}

	// if a flag already exists on this location, remove it
	if(flagExist(x, y)){
		removeFlag(x, y);
	}

	let overlay = document.createElement("div");

	if(value < 9 && value != 0){
		overlay.innerText = value;
		overlay.style.color = getColorFromValue(value);
	}
	else if(value == 9){
		overlay.innerText = "💣";
		overlay.style.backgroundColor = "red";
		overlay.style.fontSize = "0.75em";
	}
	else if(value == 10){
		overlay.innerText = "💣";
		overlay.style.fontSize = "0.75em";
	}
	else if(value == 11){
		overlay.innerText = "🚩";
		overlay.style.fontSize = "0.75em";
	}

	overlay.style.height = `${CELLSIZE}px`;
	overlay.style.width = `${CELLSIZE}px`;
	overlay.style.left = `${x * CELLSIZE}px`;
	overlay.style.top = `${y * CELLSIZE}px`;
	overlay.setAttribute("class", "overlay");
	overlay.setAttribute("id", `${x}-${y}`);

	document.getElementById("game-body").appendChild(overlay);
}
function setBoardSize(width, height){
	let el = document.getElementById("game-body");
	el.style.width = `${width * CELLSIZE}px`;
	el.style.height = `${height  * CELLSIZE}px`;
}
function createGame(mines, width, height){
	let minesPlaced = 0;
	game = [];
	unlocked = [];

	//create empty grid
	for (let h = 0; h < height; h++) {
		game.push([]);
		unlocked.push([]);
		for (let w = 0; w < width; w++) {
			game[h].push(0);
			unlocked[h].push(false);
		}
	}
	// place mines
	while (minesPlaced != mines) {
		r = randomXY(width, height);

		if(!isMine(r.x, r.y)){
			game[r.y][r.x] = 9;
			minesPlaced++;
		}
	}
	// calculate values
	for (let h = 0; h < height; h++) {
		for (let w = 0; w < width; w++) {
			if(!isMine(w, h)){
				game[h][w] = mineCount(w, h);
			}
		}
	}
}
function startTimer(){
	endTimer();

	startTime = new Date();
	timerInterval = setInterval(function() {
		let endTime = new Date();
		let timeDiff = endTime - startTime;
		let seconds = Math.round(timeDiff / 1000);

		setDisplay(false, seconds);
	}, 500); // every half a second to prevent skipping a second
}
function endTimer(){
	clearInterval(timerInterval);
}
function setDisplay(isLeft, value){
	if(value > 999){
		value = 999;
	}

	let str = value.toString();
	let finalStr = (str.length >= 3) ? str : (new Array(3).join('0') + str).slice(-3);
	
	if(isLeft){
		document.getElementById("counter-left-val").innerText = finalStr;
	}else{
		document.getElementById("counter-right-val").innerText = finalStr;
	}
}
function reload(){
	let settings = difficultyToSettings(difficulty);

	mines = settings.mines;
	width = settings.width;
	height = settings.height;
	isFirstClick = true;
	isGameOver = false;
	flags = [];
	
	setSmiley("🙂");
	clearOverlay();
	createGame(mines, width, height);
	setBoardSize(width, height);
	drawCells(width, height);
	setDisplay(true, mines);
}
function clearOverlay(){
	let body = document.getElementById("game-body");
	
	while(body.children.length != 0){
		body.children[0].remove();
	}
}
function mineCount(x, y){
	let mines = 0;
	
	for (let i = 0; i < NEIGHBOURS.length; i++) {
		if(isMine(x + NEIGHBOURS[i][0], y + NEIGHBOURS[i][1])){
			mines++;
		}
	}
	return mines;
}
function getCell(x, y){
	return document.getElementById(`${x}-${y}`);
}
function isMine(x, y){
	return getValue(x, y) == 9;
}
function getValue(x, y){
	if(x < 0 || y < 0){
		return 99;
	}	
	if(x >= width || y >= height){
		return 99;
	}
	return game[y][x];
}
function revealMines(){
	for (let h = 0; h < height; h++) {
		for (let w = 0; w < width; w++) {
			const hasFlag = flagExist(w, h);

			// if a flag was not placed on a bomb, display it
			if(hasFlag && game[h][w] != 9){
				getCell(w, h).style.backgroundColor = "red";
			}

			if(unlocked[h][w]){
				continue;
			}
			if(game[h][w] != 9){
				continue;
			}
			// dont show the bomb where the player has placed a flag
			if(hasFlag){
				continue;
			}

			createIcon(w, h, 10);
		}
	}
}
function gameOver(){
	isGameOver = true;
	setSmiley("😵");
	endTimer();
	revealMines();
}
function completed(){
	isGameOver = true;
	setSmiley("😎");
	endTimer();
}
function setSmiley(icon){
	document.getElementById("smiley").innerText = icon;
}
function randomXY(maxX, maxY){
	const x = Math.floor(Math.random() * maxX);
	const y = Math.floor(Math.random() * maxY);
	return {x: x, y: y};
}
function difficultyToSettings(d){
	switch(d){
		case 0:
			return {width: 9, height: 9, mines: 10};
		case 1:
			return {width: 16, height: 16, mines: 40};
		case 2:
			return {width: 30, height: 16, mines: 99};
		// TODO: fetch custom settings here
	}
}
function getColorFromValue(value){
	switch(value){
		case 1: return "blue";
		case 2: return "green";
		case 3: return "red";
		case 4: return "navy";
		case 5: return "maroon";
		case 6: return "cyan";
		case 7: return "black";
		case 8: return "darkgray";
		default: return "white"; // should never be used
	}
}