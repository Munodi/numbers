"use strict";
$(function() {

	// control select numbers buttons
	var fillBoxes = function(largeCount) {
		const largeNumbers = [25, 50, 75, 100];
		const smallNumbers = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
		const numbers = [];
		for(let i = 0; i < 6; ++i) {
			((numberArr) => {
				const randIndex = Math.floor(Math.random() * numberArr.length);
				numbers.push(numberArr.splice(randIndex, 1)[0]);
			})(i < largeCount ? largeNumbers : smallNumbers);
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
	$("#generate-number").one("click", function displayRandom() {
		var randomChangesLeft = 12;
		var randomlyChangeTarget = function() {
			$("#targetnumber").text(Math.floor(Math.random() * (999 - 101 + 1)) + 101);
			if (--randomChangesLeft > 0) {
				setTimeout(randomlyChangeTarget, 75);
			} else {
				$("#generate-number-button-holder").addClass("hidden");
				$("#play-game-control-holder").removeClass("hidden");
				$("#generate-number").one("click", displayRandom);
			}
		};
		randomlyChangeTarget();
	});

	// control start clock button
	var clockReqId = 0;
	$("#start-clock").click(function() {
		$("#start-clock").addClass("hidden");
		$("#countdown-display-holder").removeClass("hidden");
		const startTime = performance.now();
		var width = 1;
		var updateClock = function() {
			const elapsedTime = (performance.now() - startTime) / 1000.0;
			$("#countdown-display").text(elapsedTime < 30 ? elapsedTime.toFixed(3) : 30);
			if(elapsedTime < 30) {
				if(width < $("#countdown-display")[0].scrollWidth) {	// make countdown-display as wide as it's ever wanted to be
					width = $("#countdown-display")[0].scrollWidth;
					$("#countdown-display").css("width", width);
				}
				clockReqId = requestAnimationFrame(updateClock);
			} else {
				$("#countdown-display").css("width", "").addClass("finished");
			}
		}
		clockReqId = requestAnimationFrame(updateClock);
	});

	var resetClock = function() {
		cancelAnimationFrame(clockReqId);
		$("#countdown-display").text("").removeClass("finished")
		$("#countdown-display-holder").addClass("hidden");
		$("#start-clock").removeClass("hidden");
	};
	$("#countdown-display").click(resetClock);

	$("#restart-button").click(function() {
		$(".number-col").each(function(index) {
			$(this).text("");
		});
		$("#targetnumber").html("&#8203;");

		resetClock();

		clearCanvas();

		$("#play-game-control-holder").addClass("hidden");
		$("#number-selection-button-holder").removeClass("hidden");
	});

	$("#clear-drawing-area-button").click(clearCanvas);

	function clearCanvas() {
		document.getElementById("solvingarea").width += 0;
	}

	// Increases 'whiteboard' canvas to fill space. As overflow is hidden the canvas size can be larger than is actually seen,
	// and a shrunk or rotated viewport has its content preserved.
	function fixCanvasSize() {
		const canvas = document.getElementById("solvingarea");

		const newWidth = Math.floor(window.innerWidth);
		const newHeight = Math.floor(window.innerHeight - $("#top").outerHeight(true));

		// increase size only if necessary
		if (newWidth > canvas.width || newHeight > canvas.height) {
			// save old canvas pixel content
			const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);

			// for width and height, increase either or both
			if (newWidth > canvas.width)
				canvas.width = newWidth;

			if (newHeight > canvas.height)
				canvas.height = newHeight;

			// then restore pixels to canvas
			canvas.getContext("2d").putImageData(imageData, 0, 0);
		}
	}

	$(window).resize(fixCanvasSize);
	fixCanvasSize();

	const mouseStatus = {
		x: -1,
		y: -1,
		down: false
	};

	document.getElementById("solvingarea").addEventListener("mousedown", function(event) {
		const rect = document.getElementById("solvingarea").getBoundingClientRect();
		mouseStatus.x = event.clientX - rect.left | 0;
		mouseStatus.y = event.clientY - rect.top | 0;

		// put a dot down on mousedown so a click will leave a dot
		const ctx = document.getElementById("solvingarea").getContext("2d");
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect(mouseStatus.x, mouseStatus.y, 1, 1);

		mouseStatus.down = true;

		event.preventDefault();	// stops problems on Chrome
	});

	document.addEventListener("mouseup", function(event) {	// add to document so can detect mouseup even when not over canvas
		mouseStatus.down = false;
	});

	document.addEventListener("mousemove", function(event) {	// add to document so it can draw lines to the edge of the canvas
		// I can't remember why I put this check in, as far as I can tell it's useless but it might be important
		if(event.buttons === 0)
			mouseStatus.down = false;

		const rect = document.getElementById("solvingarea").getBoundingClientRect();
		const newX = event.clientX - rect.left | 0;
		const newY = event.clientY - rect.top | 0;

		if(mouseStatus.down) {
			const ctx = document.getElementById("solvingarea").getContext("2d");
			ctx.strokeStyle = "rgb(0,0,0)";
			ctx.beginPath();
			ctx.moveTo(mouseStatus.x + 0.5, mouseStatus.y + 0.5);
			ctx.lineTo(newX + 0.5, newY + 0.5);
			ctx.stroke();
		}

		mouseStatus.x = newX;
		mouseStatus.y = newY;
	});

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
