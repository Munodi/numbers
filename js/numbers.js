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
	}
	$("#large0").click(function() {
		fillBoxes(0)
	});
	$("#large1").click(function() {
		fillBoxes(1)
	});
	$("#large2").click(function() {
		fillBoxes(2)
	});
	$("#large3").click(function() {
		fillBoxes(3)
	});
	$("#large4").click(function() {
		fillBoxes(4)
	});

	// control generate number button
	$("#generate-number").click(function() {
		$("#targetnumber").text(Math.floor(Math.random() * 999) + 1);
	});

	// control start clock button
	var clockTimeout;
	$("#start-clock").click(function() {
		$("#start-clock").attr("disabled", true);
		var startTime = new Date().getTime();
		var updateClock = function() {
			var currentTime = new Date().getTime();
			var elapsedTime = (currentTime - startTime) / 1000.0;
			$("#countdown-display").text(elapsedTime < 30 ? elapsedTime : 30);
			if(elapsedTime < 30) {
				clockTimeout = setTimeout(updateClock, 40);
			}
			else {
				$("#start-clock").attr("disabled", false);
			}
		}
		updateClock();
	});

	$("#countdown-display").click(function() {
		clearTimeout(clockTimeout);
		$("#start-clock").attr("disabled", false);
		$("#countdown-display").text('');
	})

	var fixCanvasSize = function() {
		console.log('resized');
		var canvas = document.getElementById("solvingarea");
		var imagedata = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);

		canvas.width = Math.floor(window.innerWidth);
		canvas.height = Math.floor(window.innerHeight - $('#top').outerHeight(true));
		canvas.getContext("2d").putImageData(imagedata, 0, 0);
	}

	$(window).resize(fixCanvasSize);
	$(window).resize();

	var mouseStatus = {
		x: -1,
		y: -1,
		down: false
	};

	var handleMouseDown = function(event) {
		mouseStatus.down = true;
	}

	var handleMouseUp = function(event) {
		mouseStatus.down = false;
	}

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
	}

	document.getElementById("solvingarea").addEventListener("mousedown", handleMouseDown, false);
	document.getElementById("solvingarea").addEventListener("mouseup", handleMouseUp, false);
	document.getElementById('solvingarea').addEventListener("mousemove", handleMouseMove, false);
});