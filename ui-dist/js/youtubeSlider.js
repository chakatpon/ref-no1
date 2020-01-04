$(document).ready(function() {
    $(".slider--listing iframe").each(function (idx) {
    $(this).addClass("data-idx-" + idx).data("idx", idx);
});

    function getPlayer (iframe, onPlayerReady, clonned) {
        var $iframe = $(iframe);
    if ($iframe.data((clonned ? "clonned-" : "") + "player")) {
        var isReady = $iframe.data((clonned ? "clonned-" : "") + "player-ready");
      if (isReady) {
          onPlayerReady && onPlayerReady($iframe.data((clonned ? "clonned-" : "") + "player"));
      }        	
        return player;
    }
    else {
        var player = new YT.Player($iframe.get(0), {
        events: {
          'onReady': function () {
              $iframe.data((clonned ? "clonned-" : "") + "player-ready", true);
            onPlayerReady && onPlayerReady(player);
          }
        }
      });        
      $iframe.data((clonned ? "clonned-" : "") + "player", player);
      return player;
    }    		
}

//on first load, play the video
$(".slider--listing").on('init', function(event, slick, currentSlide) {
    var currentSlide, player, command;
    currentSlide = $(slick.$slider).find(".slick-current");        
    getPlayer(currentSlide.find("iframe"), function (player) {
        player.playVideo();
    });
});

//when new slide displays, play the video
$(".slider--listing").on("afterChange", function(event, slick) {
    var currentSlide;
    currentSlide = $(slick.$slider).find(".slick-current");
    getPlayer(currentSlide.find("iframe"), function (player) {
        player.playVideo();
    });
});

  function updateClonnedFrames () {
    frames = $(".slider--listing").find(".slick-slide").not(".slick-cloned").find("iframe");
  frames.each(function () {
      var frame = $(this);
      var idx = frame.data("idx");
      clonedFrames = $(".slider--listing").find(".slick-cloned .data-idx-" + idx);
    console.log("clonedFrames", frame, idx, clonedFrames);
    clonedFrames.each(function () {
        var clonnedFrame = this;
        getPlayer(frame[0], function (player) {
        getPlayer(clonnedFrame, function (clonedPlayer) {         
          console.log("clonnedPlayer", clonedPlayer);
          clonedPlayer.playVideo();  
          clonedPlayer.seekTo(player.getCurrentTime(), true);
          setTimeout(function () {
              clonedPlayer.pauseVideo();         
          }, 0);              
        }, true);
      });
    });        
  });    	    	
}
  
//reset iframe of non current slide
$(".slider--listing").on('beforeChange', function(event, slick, currentSlide) {
    var currentSlide, iframe, clonedFrame;
    currentSlide = $(slick.$slider).find(".slick-current");
    iframe = currentSlide.find("iframe");        
    getPlayer(iframe, function (player) {   
        player.pauseVideo();
      updateClonnedFrames();
    });          
});

//start the slider
// $('.slider--listing').slick({
//     slidesToShow: 1,
//     arrows: false,
//     centerMode: true,
//     centerPadding: '50px',
//     infinite: true,
//     variableWidth: true
// });
});
