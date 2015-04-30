var s=window.screen;
var q = document.getElementById('animator');

if (q) {

  setTimeout(function() {
    q.style.opacity = 1;
  }, 1500);

  var width = q.width=s.width;
  var height = q.height = 450;
  var yPositions = Array(Math.floor(width / 10)).join(0).split('');
  var ctx=q.getContext('2d');

  var draw = function () {
    /* is this the bg colour or colour difference? */
    ctx.fillStyle='rgba(0,0,0,.05)';
    ctx.fillRect(0,0,width,height);
    /* fillStyle to change main colour */
    ctx.fillStyle='#990000';
    ctx.font = '10pt monospace';
    yPositions.map(function(y, index){
      text = String.fromCharCode(1e2+Math.random()*33);
      text = Math.random() > 0.5 ? 0 : 1;
      x = (index * 10)+10;
      q.getContext('2d').fillText(text, x, y);
      if(y > 100 + Math.random()*1e4)
      {
        yPositions[index]=0;
      }
      else
      {
        yPositions[index] = y + 10;
      }
    });
  };

  setInterval(draw, 33);
  
}