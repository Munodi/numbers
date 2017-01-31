"use strict";
$(function() {

	// control select numbers buttons
	var fillBoxes = function(largeCount) {
		var largeNumbers = [25, 50, 75, 100];
		var numbers = [];
		for(var i = 0; i < 6; ++i) {
			if(i < largeCount) {
				var randIndex = Math.floor(Math.random() * largeNumbers.length);
				numbers.push(largeNumbers[randIndex]);
				largeNumbers.splice(randIndex, 1);
			}
			else {
				numbers.push(Math.floor(Math.random() * 10) + 1);
			}
		}
		$(".number-col").each(function(index) {
			$(this).text(numbers[index]);
		});
		$("#number-selection-button-holder").addClass("hidden");
		$("#generate-number-button-holder").removeClass("hidden");
	};
	$("#large0").click(function() {
		fillBoxes(0);
	});
	$("#large1").click(function() {
		fillBoxes(1);
	});
	$("#large2").click(function() {
		fillBoxes(2);
	});
	$("#large3").click(function() {
		fillBoxes(3);
	});
	$("#large4").click(function() {
		fillBoxes(4);
	});

	// control generate number button
	$("#generate-number").click(function() {
		var randomChangesLeft = 12;
		var randomlyChangeTarget = function() {
			$("#targetnumber").text(Math.floor(Math.random() * 999) + 1);
			--randomChangesLeft;
			if(randomChangesLeft) {
				setTimeout(randomlyChangeTarget, 75);
			} else {
				$("#generate-number-button-holder").addClass("hidden");
				$("#play-game-control-holder").removeClass("hidden");
			}
		};
		randomlyChangeTarget();
	});

	// control start clock button
	var clockTimeout;
	$("#start-clock").click(function() {
		$("#start-clock").addClass("hidden");
		$("#countdown-display").removeClass("hidden");
		var startTime = new Date().getTime();
		var updateClock = function() {
			var currentTime = new Date().getTime();
			var elapsedTime = (currentTime - startTime) / 1000.0;
			$("#countdown-display").text(elapsedTime < 30 ? elapsedTime.toFixed(3) : 30);
			if(elapsedTime < 30) {
				clockTimeout = setTimeout(updateClock, 40);
			}
		}
		updateClock();
	});

	var resetClock = function() {
		clearTimeout(clockTimeout);
		$("#countdown-display").text("");
		$("#countdown-display").addClass("hidden");
		$("#start-clock").removeClass("hidden");
	};
	$("#countdown-display").click(resetClock);

	$("#restart-button").click(function() {
		$(".number-col").each(function(index) {
			$(this).text("");
		});
		$("#targetnumber").html("&#8203;");

		resetClock();

		$("#clear-drawing-area-button").click();

		$("#play-game-control-holder").addClass("hidden");
		$("#number-selection-button-holder").removeClass("hidden");
	});

	$("#clear-drawing-area-button").click(function() {
		var canvas = document.getElementById("solvingarea").width += 0;
	});

	var fixCanvasSize = function() {
		console.log('resized');
		var canvas = document.getElementById("solvingarea");
		var imagedata = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);

		canvas.width = Math.floor(window.innerWidth);
		canvas.height = Math.floor(window.innerHeight - $('#top').outerHeight(true));
		canvas.getContext("2d").putImageData(imagedata, 0, 0);
	};

	$(window).resize(fixCanvasSize);
	$(window).resize();

	var mouseStatus = {
		x: -1,
		y: -1,
		down: false
	};

	var handleMouseDown = function(event) {
		mouseStatus.down = true;
	};

	var handleMouseUp = function(event) {
		mouseStatus.down = false;
	};

	var handleMouseMove = function(event) {
		var rect = document.getElementById('solvingarea').getBoundingClientRect();
		var newX = event.clientX - rect.left | 0;
		var newY = event.clientY - rect.top | 0;

		if(mouseStatus.down) {
			var ctx = document.getElementById('solvingarea').getContext('2d');
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.fillRect(newX, newY, 1, 1);
			ctx.beginPath();
			ctx.moveTo(mouseStatus.x + 0.5, mouseStatus.y + 0.5);
			ctx.lineTo(newX + 0.5, newY + 0.5);
			ctx.stroke();
		}

		mouseStatus.x = newX;
		mouseStatus.y = newY;
		console.log(mouseStatus);
	};

	document.getElementById("solvingarea").addEventListener("mousedown", handleMouseDown, false);
	document.getElementById("solvingarea").addEventListener("mouseup", handleMouseUp, false);
	document.getElementById("solvingarea").addEventListener("mousemove", handleMouseMove, false);

	var findSolution = function(targetNumber, numbers) {

		const createPartialExpression = function(first, remaining) {
			return {
				stack: [first],
				postfixExpr: [first],
				remaining: remaining
			};
		};

		let solution = null;
		iterativeDeepeningLoop:
		for(let minRemaining = 5; minRemaining >= 0; --minRemaining) {
			// create queue of partial expression
			const dfsStack = [];

			// add to first six nodes, that is one partial expression for each number
			for(let i = 0; i < numbers.length; ++i) {
				const remaining = numbers.slice(0);
				remaining.splice(i, 1);
				dfsStack.push(createPartialExpression(numbers[i], remaining));
			}

			while(dfsStack.length) {
				const top = dfsStack.pop();
				if(top.stack.length === 1 && top.stack[0] === targetNumber) {	// if top expression is a solution
					solution = top.postfixExpr;
					break iterativeDeepeningLoop;
				}
				if(top.remaining.length >= 1 && top.remaining.length > minRemaining) {	// if remaining is not empty and length is > minRemaining, then the expansions pushed have a remaining length >= minRemaining
					for(let i = 0; i < top.remaining.length; ++i) {	// for each number in remaining, push onto queue new expression expanded with that number
						const remaining = top.remaining.slice(0);
						remaining.splice(i, 1);
						dfsStack.push({
							"stack": top.stack.concat(top.remaining[i]),
							"postfixExpr": top.postfixExpr.concat(top.remaining[i]),
							"remaining": remaining
						});
					}
				}
				// for each operator (+-*/) if applying it makes an expression push onto queue new expression with the operation
				if(top.stack.length >= 2) {
					const n2 = top.stack.pop();
					const n1 = top.stack.pop();

					// '+'
					if(n1 >= n2)	// optimisation, taking advantage of the fact addition is commutative
						dfsStack.push({
							"stack": top.stack.concat(n1 + n2),
							"postfixExpr": top.postfixExpr.concat("+"),
							"remaining": top.remaining
						});

					// '-'
					if(n1 >= n2 && n1 - n2 !== n2)	// first comparison is needed so intermediate result is not <=0, secondis optimisation that filters out useless calculations eg. 100 - 50 = 50 so might as well just use 50
						dfsStack.push({
							"stack": top.stack.concat(n1 - n2),
							"postfixExpr": top.postfixExpr.concat("-"),
							"remaining": top.remaining
						});

					// '*'
					if(n1 != 1 && n2 != 1 && n1 >= n2)	// optimisation, don't bother multiplying by 1 and multiplication is commutative
						dfsStack.push({
							"stack": top.stack.concat(n1 * n2),
							"postfixExpr": top.postfixExpr.concat("*"),
							"remaining": top.remaining
						});

					// '/'
					if(n2 > 1 && n1 % n2 === 0)
						dfsStack.push({
							"stack": top.stack.concat(n1 / n2),
							"postfixExpr": top.postfixExpr.concat("/"),
							"remaining": top.remaining
						});
				}
			}
		}

		return solution;
	};

	$("#display-solution").click(function() {
		// get target
		const targetNumber = ~~($("#targetnumber").text());

		const numbers = [];
		$(".number-col").each(function(index) {
			numbers.push(~~($(this).text()));
		});

		if(targetNumber === 0 || numbers.indexOf(0) >= 0)		// if either is invalid, note ~~ returns 0 for non-integer string
			return;

		$("#solution-modal-text").html('calculating <i class="fa fa-spinner fa-spin"></i>');
		$("#solution-modal").modal();

		setTimeout(function() {
			const solution = findSolution(targetNumber, numbers);
			if(solution)
				console.log(solution.join(" "));

			$("#solution-modal-text").html(solution ? function() {
				const stack = [];
				const answerList = [];
				while(solution.length) {
					const first = solution.shift();
					if(typeof(first) === "number") {
						stack.push(first);
					} else {
						const n2 = stack.pop();
						const n1 = stack.pop();
						let newStackTop;
						if (first === "+") {
							newStackTop = n1 + n2;
						} else if (first === "-") {
							newStackTop = n1 - n2;
						} else if (first === "*") {
							newStackTop = n1 * n2;
						} else if (first === "/") {
							newStackTop = n1 / n2;
						}
						if (solution.length) {
							answerList.push(n1 + " " + first + " " + n2 + " = " + newStackTop);
						} else {
							answerList.push(n1 + " " + first + " " + n2 + " = <u>" + newStackTop + "</u>");
						}
						stack.push(newStackTop);
					}
				}
				return answerList.join("<br>");
			}() : "Could not find a solution");
		}, 0);
	});
});
