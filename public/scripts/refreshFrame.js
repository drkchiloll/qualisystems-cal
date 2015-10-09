//Refresh the iFrame every X Hour
window.onload = function() {
  setInterval(function() {
    var frame = document.querySelector('.iframe');
    frame.src = frame.src;
  }, 300000);
};
