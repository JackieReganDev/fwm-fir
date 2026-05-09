/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Menu
4. Init SoundCloud Player
5. Init Magic
6. Init Single Player

******************************/

$(document).ready(function()
{
	"use strict";

	/* 

	1. Vars and Inits

	*/

	var header = $('.header');
	var ctrl = new ScrollMagic.Controller();

	initMenu();
	initSoundCloudPlayer();
	initMagic();

	setHeader();

	$(window).on('resize', function()
	{
		setHeader();
	});

	$(document).on('scroll', function()
	{
		setHeader();
	});

	/* 

	2. Set Header

	*/

	function setHeader()
	{
		if($(window).scrollTop() > 91)
		{
			header.addClass('scrolled');
		}
		else
		{
			header.removeClass('scrolled');
		}
	}

	/* 

	3. Init Menu

	*/

	function initMenu()
	{
		if($('.menu').length)
		{
			var hamb = $('.hamburger');
			var menu = $('.menu');
			var menuOverlay = $('.menu_overlay');

			hamb.on('click', function()
			{
				menu.addClass('active');
			});

			menuOverlay.on('click', function()
			{
				menu.removeClass('active');
			});
		}
	}

	/* 

	4. Init SoundCloud Player

	Replaces jPlayer. Uses the SoundCloud Widget API to control
	an invisible iframe and drive the custom player UI.

	To add/remove tracks, edit the `playlist` array below.
	Each object needs:
	  - title:    Displayed in the playlist rows and "playing" bar
	  - artist:   Displayed under the title in the playing bar
	  - url:      Full SoundCloud track URL (not the embed URL)

	*/

	function initSoundCloudPlayer()
	{
		if(!$('#sc_player_container').length) return;

		// ─── YOUR TRACKS ──────────────────────────────────────────
		var playlist = [
			{
				title:  "Rich Paul",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/rich-paul"
			},
			{
				title:  "Type Beat",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/fwm-fir-type-beat"
			},
			{
				title:  "Cold World",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/fuck-wit-me-fir-cold-world"
			},
			{
				title:  "Lick",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/fwm-fir-lick"
			},
			{
				title:  "Opps",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/opps"
			},
			{
				title:  "Memories",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/memories"
			},
			{
				title:  "Toxic",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/fuck-wit-me-fir-toxic"
			},
			{
				title:  "FRFR (ft. JAG)",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/jag-ft-fwm-fir-frfr"
			},
			{
				title:  "Let Me Tell Ya",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/let-me-tell-ya"
			},
			{
				title:  "Woke (ft. NuffSaid215)",
				artist: "FWM FIR",
				url:    "https://soundcloud.com/fwm-fir/woke-ft-nuffsaid215"
			}
		];
		// ──────────────────────────────────────────────────────────

		var currentIndex = 0;
		var isPlaying    = false;
		var scWidget     = null;
		var duration     = 0;
		var tickInterval = null;

		// Build the hidden SC iframe (Widget API needs a real iframe)
		var $iframe = $('<iframe id="sc_iframe" allow="autoplay" scrolling="no" frameborder="no"></iframe>');
		$iframe.css({ position:'absolute', width:'1px', height:'1px', opacity:0, pointerEvents:'none', left:'-9999px' });
		$('body').append($iframe);

		// Build playlist rows
		var $list = $('#sc_playlist ul');
		$list.empty();
		$.each(playlist, function(i, track)
		{
			var $li = $('<li></li>');
			$li.addClass('sc_track_row d-flex flex-row align-items-center justify-content-start');
			$li.attr('data-index', i);
			$li.html(
				'<div class="sc_track_info">' +
					'<span class="sc_track_title">' + track.title + '</span>' +
					'<span class="sc_track_artist">' + track.artist + '</span>' +
				'</div>'
			);
			$list.append($li);
		});

		// Load a track by index into the SC widget
		function loadTrack(index, autoplay)
		{
			currentIndex = index;
			var track    = playlist[index];
			var embedUrl = 'https://w.soundcloud.com/player/?url=' +
				encodeURIComponent(track.url) +
				'&auto_play=' + (autoplay ? 'true' : 'false') +
				'&hide_related=true&show_comments=false&show_user=false' +
				'&show_reposts=false&show_teaser=false&visual=false';

			// Reload iframe src — Widget API re-fires 'ready' on src change
			$('#sc_iframe').attr('src', embedUrl);
			scWidget = SC.Widget(document.getElementById('sc_iframe'));

			scWidget.bind(SC.Widget.Events.READY, function()
			{
				scWidget.getDuration(function(d){ duration = d; });
				updatePlayingBar(track);
				updateActiveRow(index);

				if(autoplay)
				{
					scWidget.play();
					setPlaying(true);
				}
			});

			scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(e)
			{
				var pos     = e.currentPosition;
				var pct     = duration > 0 ? (pos / duration) * 100 : 0;
				var elapsed = formatTime(pos);
				var total   = formatTime(duration);
				$('#sc_current_time').text(elapsed);
				$('#sc_duration').text(total);
				$('#sc_play_bar').css('width', pct + '%');
			});

			scWidget.bind(SC.Widget.Events.FINISH, function()
			{
				// Auto-advance to next track
				var next = (currentIndex + 1) % playlist.length;
				loadTrack(next, true);
			});

			scWidget.bind(SC.Widget.Events.PAUSE, function(){ setPlaying(false); });
			scWidget.bind(SC.Widget.Events.PLAY,  function(){ setPlaying(true);  });
		}

		function setPlaying(state)
		{
			isPlaying = state;
			if(state)
			{
				$('#sc_play_btn').addClass('playing');
			}
			else
			{
				$('#sc_play_btn').removeClass('playing');
			}
		}

		function updatePlayingBar(track)
		{
			$('#sc_now_playing_title').text(track.title);
			$('#sc_now_playing_artist').text(track.artist);
			$('#sc_current_time').text('0:00');
			$('#sc_duration').text('--:--');
			$('#sc_play_bar').css('width', '0%');
		}

		function updateActiveRow(index)
		{
			$('.sc_track_row').removeClass('active');
			$('.sc_track_row[data-index="' + index + '"]').addClass('active');
		}

		function formatTime(ms)
		{
			if(!ms || isNaN(ms)) return '0:00';
			var s   = Math.floor(ms / 1000);
			var min = Math.floor(s / 60);
			var sec = s % 60;
			return min + ':' + (sec < 10 ? '0' : '') + sec;
		}

		// Play/pause button
		$(document).on('click', '#sc_play_btn', function()
		{
			if(!scWidget)
			{
				loadTrack(0, true);
				return;
			}
			if(isPlaying)
			{
				scWidget.pause();
			}
			else
			{
				scWidget.play();
			}
		});

		// Click a playlist row to load that track
		$(document).on('click', '.sc_track_row', function()
		{
			var idx = parseInt($(this).attr('data-index'));
			if(idx === currentIndex && scWidget)
			{
				if(isPlaying){ scWidget.pause(); } else { scWidget.play(); }
			}
			else
			{
				loadTrack(idx, true);
			}
		});

		// Seek bar click
		$(document).on('click', '#sc_seek_bar', function(e)
		{
			if(!scWidget || !duration) return;
			var pct = e.offsetX / $(this).outerWidth();
			scWidget.seekTo(pct * duration);
		});

		// Load first track (no autoplay on page load)
		loadTrack(0, false);
	}

	/* 

	5. Init Magic

	*/

	function initMagic()
	{
		if($('.image_overlay').length)
		{
			var eles = $('.image_overlay');
			eles.each(function()
			{
				var ele = this;

				var projectScene = new ScrollMagic.Scene(
				{
					triggerElement: ele,
			        triggerHook: "onEnter",
			        offset: 400,
			        reverse:false
				})
				.setClassToggle(ele, 'active')
				.addTo(ctrl);
			});
		}
	}

});