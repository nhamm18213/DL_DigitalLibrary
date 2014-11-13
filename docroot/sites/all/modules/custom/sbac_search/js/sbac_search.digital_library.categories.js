(function ($) {
  Drupal.behaviors = Drupal.behaviors || {};
  /**
   * Click functionality of the categories.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_search_categories = {
    attach: function (context, settings) {
      $('.sbac-hover').hover(
        function() {
          $(this).next('ul').addClass('open');
        },
        function() {
          $(this).next('ul').removeClass('open');
        }
      );

      $('#edit-dl-sort-order').once('searchfilterbutton', function(){
        $(this).click ( function () {
          window.location.hash = '';
        });
      });

      $(document).click(function() {
        if (!$(this).hasClass('selectedDiv')) {
          var selectedDiv = $('.selectedDiv');
          var vid = selectedDiv.attr('vid');
          $('#filter-header-' + vid).removeClass('expanded');
          $('#filter-header-' + vid).addClass('collapsed');
          selectedDiv.hide();
          selectedDiv.removeClass('selectedDiv');
        }
      });

      $('#sbac-search-filter-button').once('searchfilterbutton', function(){
        $(this).click(function() {
          var isEdit = Drupal.settings.sbac_search.isEdit;

          // The button is in edit state.
          if (isEdit) {
            $('.categories-filter.slideable').slideDown('fast');
            $('.category-hide').show();
            $(this).text(Drupal.t('Apply Filters')).removeClass('is-edit');
            Drupal.settings.sbac_search.isEdit = 0;
            return false;
          }
          else {
            $('.category-hide').hide();
            $('.categories-filter.slideable').slideUp('slow');
            $(this).text(Drupal.t('Edit Filters')).addClass('is-edit');
            Drupal.settings.sbac_search.isEdit = 1;
          }
        });
      });

      if ($('#sbac-search-current-filters').val() != '') {
        $('#edit-reset-filters').removeClass('js-hide');
        $('#sbac-search-filter-button').removeClass('js-hide');
      }
      else {
        $('.category-hide').removeClass('js-hide');
        $('.category-hide').show();
      }

      // Close the individual filter list.
      $('.category-filter-header').once('cmod-catfilterheader', function() {
        $('.category-filter-header').click( function () {
          var vid = $(this).attr('vid');
          $('.category-filter-list').hide();
          $('.category-filter-list').removeClass('selectedDiv');
          $('#filter-header-' + vid).removeClass('expanded');
          $('#filter-header-' + vid).addClass('collapsed');
          return false;
        });
      });

      // Open / Close the individual filter lists.
      $('.sbac-search-filter-name').once('cmod-searchfiltername', function() {
        $('.sbac-search-filter-name').click( function (e) {
          var vid = $(this).attr('vid');
          $('#filter-header-' + vid).removeClass('collapsed');
          $('#filter-header-' + vid).addClass('expanded');
          $('.category-filter-list').hide();
          $('.category-filter-list-' + vid).show();
          $('.category-filter-list-' + vid).addClass('selectedDiv');
          // Added to remove the overflow issue on Chrome and Safari.
          var style = $('.categories-filter.slideable').attr('style');
          if (style !== undefined) {
            style = style.replace('overflow: hidden');
            $('.categories-filter.slideable').attr('style', style);
          }
          e.stopPropagation();
          return false;
        });
      });

      // Open / Close the filter list.
      $('#sbac-search-cat-button').once('cmod-searchcatbutton', function() {
        $('#sbac-search-cat-button').click( function () {
          // allow open/close category if not on no results page
          close_categories_list();
          $('.filters.sbac-filter-cat-area').show();
          $('.selectedDiv').hide();
          return false;
        });
      });

      // Close the filter list.
      $('#sbac-search-close-button').once('cmod-searchclosebutton', function() {
        $('#sbac-search-close-button').click( function () {
          close_categories_list();
          $('.selectedDiv').hide();
          return false;
        });
      });

      // Close the filter list.
      $('.category-hide').once('cmod-cathide', function() {
        $('.category-hide').click( function () {
          var slideableItems = $('.slideable');
          if (slideableItems.is(':visible')) {
            $(this).text(Drupal.t('Show Categories'));
            $(this).toggleClass('active');
          }
          else {
            $(this).text(Drupal.t('Hide Categories'));
            $(this).toggleClass('active');
          }
          close_categories_list();
          $('.selectedDiv').hide();
          return false;
        });
      });

      // Open / Close the filter list.
      close_categories_list = function () {
        var slideableItems = $('.slideable');
        if (slideableItems.is(':visible')) {
          $.cookie("sbac-digital-library-filters-closed", 1);
          slideableItems.slideUp('slow');
          $('.sbac-filter-cat-area').removeClass("active");
        }
        else{
          $.cookie("sbac-digital-library-filters-closed", 0);
          slideableItems.slideDown('fast');
          $('.sbac-filter-cat-area').addClass("active");
        }
      }
    }
  };

  /**
   * Clears all current filters.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_clear_all_categories = {
    attach: function (context, settings) {
      // Removes all individual filters.
      $('.categories-clear-all-button').click(this.clearAllCategories);
      $('#edit-reset-filters').click(this.clearAllCategories);
    },

    clearAllCategories: function() {
      var current_filters = $('#sbac-search-current-filters');
      $('.categories-current-filters').addClass('noshow');
      current_filters.val('');
      $('#sbac-search-filter-button').hide();
      $('#edit-reset-filters').hide();
      $('.slideable').hide();
      $('.category-hide').hide();
      Drupal.settings.sbac_search.isEdit = 0;
      $('#sbac-search-digital-library-resources-form').submit();
      return false;
    }
  };

  /**
   * Clears all current filters.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_search_textbox = {
    attach: function (context, settings) {
      // Moves the text into the hidden field.
      $('.sbac-search-textbox').keypress( function(event) {
        var keypressed = event.which;
        if(keypressed == 13){
          $('#sbac-search-keywords').val($(this).val());
          $('#sbac-search-filter-button').click();
          return false;
        }
      });

      // Moves the text into the hidden field.
      $('.sbac-search-textbox').change( function(event) {
        $('#sbac-search-keywords').val($(this).val());
      });

      // Hide the Keyword field.
      $('#views-exposed-form-resources-grid-view').hide();
      $('#views-exposed-form-resources-list-view').hide();

      if ($('.sbac-search-textbox').val() != '') {
        $('.form-item-search-block-form').append('<span class="sbac-clear-search"></span>');
      }
    }
  };


  /**
   * Handles ajax pager via hash in URL
   *
   * @type {{attach: Function}}
   */
  var ajax_request = null;
  var has_run_once = false;
  var clicked = false;
  var pager_count = 0;
  Drupal.behaviors.sbac_search_load_more = {
    attach: function (context, settings) {
      // Change the button text
      if ($('.pwd-highlight').length) {
        var loadMoreButton = 'More Resources Posted With Distinction';
      }
      else {
        var loadMoreButton = 'Show More Resources';
      }
      $('.pager-next a').html(loadMoreButton).addClass('button');

      // On click, add the hash in the URL.
      $('.pager-next a').once('pager-next-click', function () {
        $(this).click( function() {
          var href = $(this).attr('href');
          var pos = href.indexOf('?');
          if (pos > -1) {
            var query = href.substring(pos);
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
              var pair = vars[i].split("=");
              if (pair[0] == 'page') {
                pager_count = pair[1];
              }
            }
          }
          else {
            pager_count++;
          }
          window.location.hash = 'pager=' + pager_count;
          clicked = true;
        });
      });

      // Move and resize the modalBackdrop on resize of the window
      modalBackdropResize = function(){
        // Get our heights
        var docHeight = $(document).height();
        var docWidth = $(document).width();
        var winHeight = $(window).height();
        var winWidth = $(window).width();
        if( docHeight < winHeight ) docHeight = winHeight;
        // Apply the changes
        $('#modalBackdrop').css('height', docHeight + 'px').css('width', docWidth + 'px').show();
      };
      $(window).bind('resize', modalBackdropResize);

      var hash = window.location.hash;
      if (hash != '' && !has_run_once && !clicked) {
        if (hash.indexOf('#pager=') > -1) {
          var pager = hash.replace('#pager=', '');
          if (ajax_request == null) {
            if (self.pageYOffset) { // all except Explorer
              var wt = self.pageYOffset;
            } else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
              var wt = document.documentElement.scrollTop;
            } else if (document.body) { // all other Explorers
              var wt = document.body.scrollTop;
            }
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
            var img_location = '/sites/all/themes/SBAC/images/foundation/orbit/loading.gif';
            var img = '<img src="' + img_location + '" alt="Smiley face" height="128" width="128">';
            $('body').append('<div id="modalBackdrop" style="z-index: 1000; display: block;"></div><div id="modalContent" style="z-index: 1001; position: absolute;">' + img + '</div>');
            // Create our content div, get the dimensions, and hide it
            var modalContent = $('#modalContent').css('top','-1000px');
            var mdcTop = wt + ( winHeight / 2 ) - (  modalContent.outerHeight() / 2);
            var mdcLeft = ( winWidth / 2 ) - ( modalContent.outerWidth() / 2);
            $('#modalBackdrop').css(css).css('top', 0).css('height', docHeight + 'px').css('width', docWidth + 'px').show();
            modalContent.css({top: mdcTop + 'px', left: mdcLeft + 'px'});

            // Make the request
            ajax_request = $.ajax({
              type: 'POST',
              url: "/sbac-resource/load-more",
              data: {'view' : 'resources', 'page' : pager},
              success: function(data) {
                // Parse the response
                var response = jQuery.parseJSON(data);
                // Inject the content
                if ($('.pwd-highlights-container').length) {
                  $('.pwd-highlights-container').remove();
                }
                $('.row.digital-library').replaceWith(response.rendered_content);
                // Create fake setting to attach new view_dom_id to handlers.
                var dom_id = 'views_dom_id:' + response.view_dom_id;
                var setting = {};
                setting[dom_id] = {
                  'pager_element' : response.pager_element,
                  'view_args' : response.view_args,
                  'view_base_path' : response.view_base_path,
                  'view_display_id' : response.view_display_id,
                  'view_dom_id' : response.view_dom_id,
                  'view_name' : response.view_name,
                  'view_path' : response.view_path
                };

                // Attach new behavior.
                settings.views.ajaxViews = setting;
                Drupal.attachBehaviors($('.row.digital-library'), settings);
                has_run_once = true;
                $('#modalBackdrop').remove();
                $('#modalContent').remove();
              },
              error: function(data) {
              }
            });
          }
        }
      }
    }
  };


  Drupal.behaviors.sbac_search_clear = {
    attach: function (context, settings) {
      $('.sbac-clear-search').click( function() {
        window.location.href = 'sbac-search/clear-all?location=digital-library-resources';
      });
    }
  };

})(jQuery);

/**
 * jstree requires jQuery 1.9 and above so we are using jQuery 1.9.0 here
 */
(function ($) {
  Drupal.behaviors.sbac_search_filters = {
    attach: function (context, settings) {
      current_filter_clicked = function () {
        var tid = $(this).attr('tid');
        var vid = $(this).attr('vid');
        $.jstree.reference('filter-' + vid).deselect_node(vid + ':' + tid);
        build_current_filters();
      };

      // build the current filter list
      build_current_filters = function () {
        var $current_filter_div = $('.categories-current-filters');
        var $reset_filters = $('#edit-reset-filters');
        var $search_button = $('#sbac-search-filter-button');
        var $hidden_filters = $('#sbac-search-current-filters');
        $current_filter_div.empty();
        // Get all the trees
        var filters = [];
        $('.jstree').each(function (i, element) {
          var $tree = $.jstree.reference(element.id);
          // get selected terms
          var selected = $tree.get_selected();
          if (selected.length > 0) {
            // Show the buttons
            $reset_filters.removeClass('js-hide');
            $search_button.removeClass('js-hide');
            $current_filter_div.removeClass('noshow');
            $.each(selected, function (i, selected_id) {
              filters.push(selected_id);
              var parent_id = $tree.get_parent(selected_id);
              if ($tree.is_selected(parent_id)) {
                // the parent node is fully (NOT partially) selected, don't print this child node because we will print just the parent node later
              }
              else {
                var this_node = $tree.get_node(selected_id);
                var $new_filter = $('<div class="current-filter" vid="' + this_node.li_attr.vid + '" tid="' + this_node.li_attr.tid + '">' + this_node.li_attr.term + '</div>').click(current_filter_clicked);
                $current_filter_div.append($new_filter);
              }
            });
          }
        });
        // save the selected filters to the hidden field
        $('#sbac-search-current-filters').val(filters.join('::'));
      };

      // initialize all the jstrees
      $('.jstree')
        .on('changed.jstree', build_current_filters)
        .jstree({
          "plugins": ["checkbox"]
        });

      // look at the current filters and select the jstree values (because initially the tree will be empty, we are just repopulating according to the current filters)
      $('#sbac-category-current-filters .current-filter').each(function(i, value) {
        var vid = $(value).attr('vid');
        var tid = $(value).attr('tid');
        var node_id = vid + ':' + tid;
        var this_tree = $.jstree.reference('filter-' + vid);
        var name = $(value).text();
        var node = {
          'text': name,
          'id': node_id,
          'li_attr': {
            'tid': tid,
            'vid': vid,
            'term': name
          },
          'state': {
            'selected': true
          }
        };
        if (this_tree) {
          // if the tree exists then select the node
          this_tree.select_node(node_id);
          if (!this_tree.is_selected(node_id)) {
            // if the node doesn't exist, then create it and select it
            this_tree.create_node('#', node);
          }
        }
        else {
          // if the tree doesn't exist then create it
          var tree_id = 'filter-' + vid;
          var $temp = $('#' + tree_id).length ? $('#' + tree_id) : $('<div id="' + tree_id + '" class="jstree js-hide"></div>');
          $('.categories-container').append($temp);
          $temp
            .on('changed.jstree', build_current_filters)
            .jstree({'core': {'check_callback': true}, "plugins": ["checkbox"]});
          // and create the node
          $.jstree.reference(tree_id).create_node('#', node)
        }
      });

      build_current_filters();

    }
  };

})(jq190);