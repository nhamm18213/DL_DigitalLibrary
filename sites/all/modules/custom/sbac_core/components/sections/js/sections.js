(function($) {

// we need to log events on css class changes, so we create a closure
// and override jQuery's addClass and removeClass functions
/*
(function() {
  var original = jQuery.fn.addClass;

  jQuery.fn.addClass = function() {
      var result = original.apply(this, arguments);
      jQuery(this).trigger('classAdded', arguments);
      return result;
  }

  jQuery.fn.removeClass = function() {
      var result = original.apply(this, arguments);
      jQuery(this).trigger('classRemoved', arguments);
      return result;
  }
})();
*/

Drupal.behaviors.sections = {
  attach: function (context, settings) {
    // check for tab hash and switch the active tab
    if (window.location.hash) {
      $('body').once('switch-section', function() {
        var hash = window.location.hash;
        Drupal.behaviors.sections.switch_tab(hash);
      });
    }

    // add support for disabling sections via class name
    var container = $('.section-container');
    if (container.length) {
      $('section', container).each(function(i, el) {
        var el = $(el);

        el.click(function(e) {
          if (el.hasClass('disabled')) {
            e.preventDefault();
            return false;
          }
        });
        
        /*
        el.bind('classAdded', function(e, css_class) {
          if (css_class == 'active') {
            window.location.hash = hash;
          }
        });
        */
      });
    }
  },

  /**
   * Switches ZURB tab to specified tab hash
   * 
   * @param  {[type]} hash [description]
   * @return {[type]}      [description]
   */
  switch_tab: function(hash) {
    if (hash == '#profile-notifications') {
      Drupal.behaviors.sbac_taskit.mark_notifications_read();
    }

    var tab = $('a[href=' + hash + ']');
    if (tab.length) {
      var section_container = tab.closest('.section-container');
      var section = tab.closest('section');

      // ensure data exists and that we're not switching to a disabled section
      if (section_container.length && section.length && !section.hasClass('disabled')) {
        // disable all sections
        $('section', section_container).removeClass('active').css('padding-top', 0);

        // enable the one we're interested in
        section.addClass('active').css('padding-top', '37px');
      }
    }
  }
};

})(jQuery);