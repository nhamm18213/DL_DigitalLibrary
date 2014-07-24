(function ($) {
  Drupal.behaviors = Drupal.behaviors || {};

  Drupal.behaviors.sbac_flag = {
    attach: function (context, settings) {
      // Hide modal button.
      if ($('#sbac-flag-resource-modal').length) {
        $('#sbac-flag-resource-modal').hide();
      }

      // If there is an error, click the radio button so that the
      // textarea moves to the right location.
      if ($('input[name=flag_options]:radio:checked')) {
        var radio = $('input[name=flag_options]:radio:checked');
        radio.click();
      }

      // On click of radio button, move textarea.
      $('#sbac-flag-options input').click( function() {
        $(this).parent().append($('#sbac-flag-optional-comment'));
        $('#sbac-flag-optional-comment').show();
      });
    }
  };

  var ajax_request = null;
  var has_run_once = false;
  var clicked = false;
  var pager_count = 0;
  Drupal.behaviors.sbac_flag_load_more = {
    attach: function (context, settings) {
      $('#sbac-load-more').once('sbac-load-more-click', function () {
        $(this).click( function() {
          // On click, hash the url
          var pager_count = $(this).attr('offset');
          window.location.hash = 'pager=' + pager_count;
          clicked = true;
          Drupal.behaviors.sbac_flag_load_more.load_more_content(pager_count, true, false);
          return false;
        });
      });

      var hash = window.location.hash;
      if (hash != '' && !has_run_once && !clicked) {
        var pager = hash.replace('#pager=', '');
        Drupal.behaviors.sbac_flag_load_more.load_more_content(pager, false, true);
        has_run_once = true;
      }

      // Move and resize the modalBackdrop on resize of the window
      modalBackdropResize = function(){
        // Get our heights
        var docHeight = $(document).height();
        var docWidth = $(document).width();
        var winHeight = $(window).height();
        if( docHeight < winHeight ) docHeight = winHeight;
        // Apply the changes
        $('#modalBackdrop').css('height', docHeight + 'px').css('width', docWidth + 'px').show();
      };
      $(window).bind('resize', modalBackdropResize);
    },
    load_more_content: function(offset, load_more, display_backdrop) {
      if (ajax_request == null) {
        if (display_backdrop) {
          // Get the docHeight and (ugly hack) add 50 pixels to make sure we dont have a *visible* border below our div
          var docHeight = $(document).height() + 50;
          var docWidth = $(document).width();
          var winHeight = $(window).height();
          var winWidth = $(window).width();
          if( docHeight < winHeight ) docHeight = winHeight;

          // Create CSS attributes
          css = jQuery.extend({
            position: 'absolute',
            left: '0px',
            margin: '0px',
            background: '#000',
            opacity: '.55'
          }, {});

          // Add opacity handling for IE.
          css.filter = 'alpha(opacity=' + (100 * css.opacity) + ')';
          $('body').append('<div id="modalBackdrop" style="z-index: 1000; display: block;"></div>');
          $('#modalBackdrop').css(css).css('top', 0).css('height', docHeight + 'px').css('width', docWidth + 'px').show();
        }

        ajax_request = $.ajax({
          type: 'POST',
          url: "/sbac-flag/load-more",
          data: {'offset' : offset},
          success: function(data) {
            var response = jQuery.parseJSON(data);
            if (load_more) {
              $('#sbac-flag-mod-cont').append(response.list_output);
            }
            else {
              $('#sbac-flag-mod-cont').replaceWith(response.list_output);
            }
            $('#sbac-load-more').attr('offset', response.offset);
            if (response.remove_button == true) {
              $('#sbac-load-more').hide();
            }
            Drupal.attachBehaviors();
            if (display_backdrop) {
              $('#modalBackdrop').remove();
            }
          },
          error: function(data) {
          }
        });
      }
    }
  };

})(jQuery);
