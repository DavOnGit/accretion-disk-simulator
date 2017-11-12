
var wWidth = 0;
var wHeight = 0;
var pjs;
var showMenu = false;

var data = {
  particlesNum: 250,
  massRange: [3, 12],
  gravity: 0.8,
  density: 0.001,
  spin: 1.8,
  collisionThreshold: 1.2,
  initialMaxDistance: 600,
  zoom: 3
};

window.addEventListener('load', function () {
  var canvas1 = document.getElementById('canvas1');
  var menu = document.getElementById('controls');
  var menuOpenBtn = document.getElementById('menuOpenBtn');
  var menuCloseBtn = document.getElementById('menuCloseBtn');
  
  wWidth = window.innerWidth;
  wHeight = window.innerHeight;
  pjs = new Processing(canvas1);
  
  menuOpenBtn.addEventListener('click', function() {
    pjs.noLoop();
    menu.classList.add('active');
  });
  
  menuCloseBtn.addEventListener('click', function() {
    menu.classList.remove('active');
    window.setTimeout(pjs.loop, 300);
  });
  
  var dataForm = document.getElementById('dataForm');
  dataForm.addEventListener('submit', function (event) {
    event.preventDefault();
    data = {
      particlesNum: Number(event.target[0].value),
      massRange: [Number(event.target[1].value), Number(event.target[2].value)],
      gravity: Number(event.target[3].value),
      density: Number(event.target[4].value),
      spin: Number(event.target[5].value),
      collisionThreshold: Number(event.target[6].value),
      initialMaxDistance: Number(event.target[7].value),
      zoom: Number(event.target[8].value)
    }
    menu.classList.remove('active');
    setTimeout(startSimulation, 300);
  });
  
  startSimulation();
});

function startSimulation() {
  if (pjs) {
    pjs.noLoop();
  }

  pjs.setup = function() {
    pjs.size(wWidth, wHeight);
    pjs.loop();
  }
  sketchProc(pjs);
  pjs.setup();
};

function toggleMenu() {
  
};

function sketchProc(processing) {
  console.log('FkU!', data);
  with (processing) {

  // Reduce this number if simulation is too slow.
  var numParticles = data.particlesNum;
  var initialMassRange = data.massRange;
  var initialMaxDistance = data.initialMaxDistance;
  
  // This gives the cloud some initial rotation
  var startWithRotation = true;
  var initialSpin = data.spin;
  
  var GRAVITATIONAL_CONSTANT = data.gravity;
  var density = data.density;
  
  // How close particles have to be for a collision
  var collisionThreshold = data.collisionThreshold;
  
  // How much mass a particle needs for it to become a star
  var sunThreshold = 400;//K type main sequence star
  //var brownDwarfThreshold = 8.2732;
  //var redDwarfThreshold = 50;
  var GThreshold = 533.33;//G type main sequence star
  var FThreshold = 666.67;
  var AThreshold = 933.33;
  var BThreshold = 1333.33;
  
  // Display variables
  var backgroundColor = color(10, 10, 20);
  var particleColor = color(240, 240, 220);
  var sunColor = color(255, 153, 0);
  var brownDwarfColor = color(64, 43, 43);
  var redDwarfColor = color(171, 65, 65);
  var gColor = color(255, 242, 0);
  var fColor = color(240, 240, 93);
  var aColor = color(107, 130, 247);
  var bColor = color(44, 53, 219);
  var myFont = createFont('times', 12);
  var angularMomentumLineHeight = 220;
  
  var centerX = wWidth / 2;
  var centerY = wHeight / 2;
  var toolbarWidth = 400;
  var toolbarHeight = 80;
  var toolbarStartX = centerX - (toolbarWidth / 2);
  var toolbarStartY = wHeight - toolbarHeight;
  var sliderX = toolbarStartX + 20;
  var sliderY = wHeight - 50;
  var sliderWidth = 80;
  var buttonY = wHeight - 35;
  
  var rotateRate = 0.01; // Speed of rotation using mouse
  
  var running = true;
  var mouseOverButton = false;
  var currentScale = data.zoom;
  var colourScale = initialMaxDistance * currentScale;
  var maxScale = 100;
  
  // These values are filled in later
  var totalMass = 0;
  var maxMass = 0;
  var massHistogram = [];
  
  for (var h=0; h<12; h++) {
    massHistogram.push(0);
  }
  
  // Take the logarithm base two of the mass
  var binMass = function(mass) {
    for (var i=massHistogram.length-1; i>=0; i--){
      if (mass > pow(2, i)) {
        return i;
      }
    }
  };
  
  var Particle = function(x, y, z, v, m) {
    this.position = [x, y, z];
    this.velocity = v;
    this.mass = m;
    this.combineWith = [];
    this.mergedWithParticle = -1;
    
    // Radius is the cube root of mass
    this.getRadius = function() {
      this.radius = pow(3 * this.mass / (4 * PI * density), 1/3);
    };
    
    this.getRadius();
    
    this.draw = function() {
      var c;
      
      if (this.mass < sunThreshold) {
        // Particles are darker the further away they are
        var d = constrain((this.position[2] + 0.5 * colourScale) /
        colourScale, 0.05, 1);
        c = lerpColor(backgroundColor, particleColor, d);
      } else if (this.mass < GThreshold  ){
        var d = constrain((this.position[2] + 0.5 * colourScale) /
        colourScale, 0.05, 1);
        c = sunColor;
      } else if(this.mass < FThreshold) {
        var d = constrain((this.position[2] + 0.5 * colourScale) /
        colourScale, 0.05, 1);
        c = gColor;
      } else if(this.mass <AThreshold){
        var d = constrain((this.position[2] + 0.5 * colourScale) /
        colourScale, 0.05, 1);
        c = fColor;
      } else if(this.mass <BThreshold) {
        var d = constrain((this.position[2] + 0.5 * colourScale) /
        colourScale, 0.05, 1);
        c = aColor;
      } else {
        c = bColor;
      }
      fill(c);
      
      var span = this.radius * 2; // * currentScale / log(currentScale);
      
      if (span <= 1) {
        point(this.position[0], this.position[1]);
      } else {
        ellipse(this.position[0], this.position[1], span, span);
      }
    };
    
    this.move = function() {
      this.position[0] += this.velocity[0];
      this.position[1] += this.velocity[1];
      this.position[2] += this.velocity[2];
    };
    
    this.attract = function(that, idx) {
      var dx = this.position[0] - that.position[0];
      var dy = this.position[1] - that.position[1];
      var dz = this.position[2] - that.position[2];
      var d = sqrt(dx * dx + dy * dy + dz * dz);
      
      if (d < (this.radius + that.radius) * collisionThreshold) {
        that.index = idx;
        this.combineWith.push(that);
        return;
      }
      
      var force = (GRAVITATIONAL_CONSTANT * this.mass * that.mass) / (d * d);
      var accel1 = force / this.mass;
      var accel2 = force / that.mass;
      
      dx /= d;
      dy /= d;
      dz /= d;
      
      this.velocity[0] -= accel1 * dx;
      this.velocity[1] -= accel1 * dy;
      this.velocity[2] -= accel1 * dz;
      
      that.velocity[0] += accel2 * dx;
      that.velocity[1] += accel2 * dy;
      that.velocity[2] += accel2 * dz;
    };
    
    this.mergeWith = function(that) {
      var mergedMass = this.mass + that.mass;
      var proportion = this.mass / mergedMass;
      
      for (var i=0; i<3; i++) {
        this.position[i] = this.position[i] * proportion +
        that.position[i] * (1 - proportion);
        this.velocity[i] = this.velocity[i] * proportion +
        that.velocity[i] * (1 - proportion);
      }
      
      // Update histogram
      massHistogram[binMass(this.mass)]--;
      massHistogram[binMass(mergedMass)]++;
      
      this.mass = mergedMass;
      if (this.mass > maxMass) { maxMass = this.mass; }
      
      this.getRadius();
      this.combineWith = [];
    };
  };
  
  var initialiseParticles = function(n) {
    var particles = [];
    var massRange = initialMassRange[1]-initialMassRange[0];
    totalMass = 0;
    
    for (var i=0; i<n; i++) {
      // Randomly distribute within sphere
      var Θ = acos( random() * 2 - 1 );
      var φ = random() * 360;
      var r = initialMaxDistance * pow(random(), 1/3);
      var x = r * sin(Θ) * cos(φ);
      var y = r * sin(Θ) * sin(φ);
      var z = r * cos(Θ);
      
      var v = [];
      if (startWithRotation) {
        var d = initialSpin / sqrt(x * x + y * y);
        v.push(random() * d * y);
        v.push(random() * d * (-x));
        v.push(random() * 0.2 - 0.1);
      } else {
        v = [random() - 0.5, random() - 0.5, random() - 0.5];
      }
      
      var m = initialMassRange[0] + random() * massRange;
      if (m > maxMass) { maxMass = m; }
      totalMass += m;
      massHistogram[binMass(m)] += 1;
      particles.push(new Particle(x, y, z, v, m));
    }
    return particles;
  };
  
  var particles = initialiseParticles(numParticles);
  
  // Adjust to keep centered on the center of mass
  // But maybe this never changes
  var centerParticles = function(particles) {
    var mid = [0, 0, 0];
    var i;
    
    for (var d=0; d<3; d++) {
      for (i=0; i<particles.length; i++) {
        var p = particles[i];
        if (p !== undefined) {
          mid[d] += p.mass * p.position[d];
        }
      }
      
      mid[d] /= totalMass;
      
      for (i=0; i<particles.length; i++) {
        particles[i].position[d] -= mid[d];
      }
    }
    
    resetMatrix();
    translate(centerX, centerY);
    scale(1/currentScale, 1/currentScale);
  };
  
  var drawSlider = function(x, y) {
    strokeWeight(1);
    fill(20, 20, 50);
    
    textAlign(LEFT, CENTER);
    textFont(myFont, 14);
    textSize(12);
    text('Scale 1:' + round(currentScale * 10) / 10, x, y - 16);
    
    rect(x, y, sliderWidth, 3, 4);
    stroke(160, 160, 160);
    line(x + 1, y, x + sliderWidth - 2, y);
    
    fill(180, 180, 180);
    stroke(50, 50, 50);
    var proportion = (currentScale - 0.5) / (maxScale - 0.5);
    var buttonX = x + sliderWidth * proportion - 5;
    
    rect(buttonX, y - 7, 10, 16, 3);
    line(buttonX + 3, y - 2, buttonX + 7, y - 2);
    line(buttonX + 3, y + 1, buttonX + 7, y + 1);
    line(buttonX + 3, y + 4, buttonX + 7, y + 4);
  };
  
  var drawHistogram = function() {
    var barWidth = 9;
    var x = toolbarStartX + 260;
    var y = wHeight - 18;
    var i;
    
    // Axis
    stroke(10,10,10);
    var axisLength = massHistogram.length * (barWidth + 1) + 2;
    line(x, y, x + axisLength, y);
    
    // Label
    fill(10, 10, 20);
    textFont(myFont, 11);
    textAlign(CENTER, BASELINE);
    text('log(mass) distribution', x + (axisLength / 2), y + 12);
    
    // Bars
    noStroke();
    
    var maxHeight = 5;
    for(i=0; i<massHistogram.length; i++) {
      if (massHistogram[i] > maxHeight) {
        maxHeight = massHistogram[i];
      }
    }
    
    var scaleHeight = (toolbarHeight - 35) / maxHeight;
    
    textFont(myFont, 10);
    for(i=0; i<massHistogram.length; i++) {
      var barHeight = round(massHistogram[i] * scaleHeight);
      fill(250, 250, 255, 180);
      rect(x + 1, y - barHeight, barWidth, barHeight);
      fill(10, 10, 20);
      text(massHistogram[i], x + barWidth/2, y - barHeight-2);
      x += barWidth + 1;
    }
    
  };
  
  var findMeanAngularMomentum = function() {
    var angularM = [0,0,0];
    for (var p=0; p<particles.length; p++) {
      var a = particles[p].position;
      var b = particles[p].velocity;
      var x = a[1] * b[2] - a[2] * b[1];
      var y = a[2] * b[0] - a[0] * b[2];
      var z = a[0] * b[1] - a[1] * b[0];
      var d = sqrt(x*x + y*y + z*z) /
      (angularMomentumLineHeight * currentScale);
      
      // Normalise and scale by mass
      //var m = particles[p].mass / d;
      var m = 10 / d;
      angularM[0] += x * m;
      angularM[1] += y * m;
      angularM[2] += z * m;
    }
    angularM[0] /= totalMass;
    angularM[1] /= totalMass;
    angularM[2] /= totalMass;
    return angularM;
  };
  
  var drawAngularMomentum = function() {
    var am = findMeanAngularMomentum();
    stroke(255, 0, 0);
    strokeWeight(currentScale*2);
    line(-am[0], -am[1], am[0], am[1]);
  };
  
  var findMostDistanceParticle = function() {
    var maxDistance = 0;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var d = p.position[0] * p.position[0];
      d += p.position[1] * p.position[1];
      d += p.position[2] * p.position[2];
      d = sqrt(d);
      if (d > maxDistance) {
        maxDistance = d;
      }
    }
    return maxDistance;
  };
  
  var handleMouseEvents = function() {
    var y = toolbarStartY;
    mouseOverButton = false;
    
    if (mouseY > y) {
      var x = toolbarStartX;
      resetMatrix();
      
      fill(60, 200, 255, 100);
      rect(0, y, wWidth, toolbarHeight);
      
      strokeWeight(2);
      stroke(200, 200, 200);
      line(0, y, wWidth, y);
      
      drawSlider(sliderX, sliderY);
      fill(20, 20, 50);
      textAlign(LEFT, CENTER);
      text('Number of bodies: ' + particles.length, x + 120, y + 20);
      text('Most massive body: ' + round(maxMass), x + 120, y + 40);
      text('Total mass: '+ round(totalMass), x + 120, y + 60);
      
      drawHistogram();
      
      strokeWeight(1);
      fill(200, 200, 200, 100);
      
      // Mouseover effect
      if (mouseY > buttonY && mouseX > x + 55 && mouseX < x + 75) {
        fill(240, 240, 240);
        mouseOverButton = true;
      }
      
      if (running) {
        // Pause button
        rect(x + 56, buttonY, 5, 20, 5);
        rect(x + 65, buttonY, 5, 20, 5);
      } else {
        triangle(x + 56.5, buttonY, x + 70, buttonY + 8, x + 56.5, buttonY + 16);
      }
    }
  };
    
  var rotateY3D = function(theta) {
    var ct = cos(theta);
    var st = sin(theta);
    var x, z;
    
    for (var i = 0; i < particles.length; i+=1) {
      var p = particles[i];
      
      x = p.position[0];
      z = p.position[2];
      p.position = [ct * x + st * z, p.position[1], -st * x + ct * z];
        
      x = p.velocity[0];
      z = p.velocity[2];
      p.velocity = [ct * x + st * z, p.velocity[1], -st * x + ct * z];
    }
  };
        
  var rotateX3D = function(theta) {
    var ct = cos(theta);
    var st = sin(theta);
    var y, z;
    
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      
      y = p.position[1];
      z = p.position[2];
      p.position = [p.position[0], ct*y - st*z, st*y + ct*z];
      
      y = p.velocity[1];
      z = p.velocity[2];
      p.velocity = [p.velocity[0], ct*y - st*z, st*y + ct*z];
    }
  };
        
  var sortByZ = function(a, b) {
    return a.position[2] - b.position[2];
  };
        
  var mergedIndex = function(particlesArr, i) {
    var mergedWith = particlesArr[i].mergedWithParticle;
    if (mergedWith === -1) {
      return i;
    }
    return mergedIndex(particlesArr, mergedWith);
  };

  draw = function() {
    var i, j;

    if (running && particles.length === 1) {
      //console.log('sigle particle of mass: ' + particles[0].mass);
      //console.log('total mass: ' + round(totalMass));
      // Move particle
      particles[0].move();
    }
    
    if (running) {
      // Gravitational attraction
      for (i=0; i<particles.length; i++) {
        for (j=i+1; j<particles.length; j++) {
          particles[i].attract(particles[j], j);
        }
      }
      
      // Combine particles
      var particlesToRemove = [];
      
      for (i=particles.length - 1; i>=0; i--) {
        for (j=0; j<particles[i].combineWith.length; j++) {
          var pIndex = particles[i].combineWith[j].index;
          
          if (particlesToRemove.indexOf(pIndex) > -1) {
            var pIndex = mergedIndex(particles, pIndex);
          }
          
          var p = particles[pIndex];
          particles[i].mergeWith(p);
          p.mergedWithParticle = i;
          particlesToRemove.push(pIndex);
        }
      }
      
      // Remove particles
      particlesToRemove.sort(function(a, b) { return b - a; });
      
      for (i=0; i<particlesToRemove.length; i++) {
        var r = particlesToRemove[i];
        massHistogram[binMass(particles[r].mass)]--;
        particles.splice(r, 1);
      }
      
      particlesToRemove = [];
      
      // Move particles
      for (i=0; i<particles.length; i++) {
        particles[i].move();
      }
      
      particles.sort(sortByZ);
    }
    
    centerParticles(particles);
    background(backgroundColor);
    
    drawAngularMomentum();
    
    noStroke();

    for (i=0; i<particles.length; i++) { particles[i].draw(); }
    
    handleMouseEvents();
  };
  
  mouseClicked = function() {
    if (mouseOverButton) {
      if (running) {
        running = false;
      } else { running = true; }
    }
  };

  mouseDragged = function() {
    if (mouseY < toolbarStartY) {
      // Rotate universe
      rotateY3D((mouseX - pmouseX) * rotateRate);
      rotateX3D((pmouseY - mouseY) * rotateRate);
    } else if (mouseX > sliderX && mouseX < sliderX + sliderWidth &&
      mouseY > sliderY - 7 && mouseY < sliderY + 9) {
        // Drag slider for scale
        var proportion = (mouseX - sliderX) / sliderWidth;
        currentScale = proportion * (maxScale) - 0.3;
        colourScale = initialMaxDistance * currentScale;
    }
  };
  
  mouseOut = function(){
    mouseIsPressed = false;
  };
  
  keyPressed = function() {
    switch (keyCode) {
      case 37:
      centerX += 20;
      break;
      case 38:
      centerY += 20;
      break;
      case 39:
      centerX -= 20;
      break;
      case 40:
      centerY -= 20;
      break;
    }
  };

  rotateX3D(90);
  }
}
