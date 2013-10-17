(function ($) {
  Drupal.behaviors = Drupal.behaviors || {};
  var isDirty = false;
  var button_clicked = false;

  /**
   * Some general JS behavior gets attached to the resource form.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_resource_all = {
    attach: function (context, settings) {
      if (Drupal.settings.sbac_save_continue_tab != null) {
        $(Drupal.settings.sbac_save_continue_tab).click();
        Drupal.settings.sbac_save_continue_tab = null;
      }

      control_form_buttons();
      $('.vertical-tabs-list li a').click(function () {
        control_form_buttons();
      });
    }
  };

  Drupal.behaviors.sbac_resource_more_less = {
    attach: function (context, settings) {
      $('.more-less .more').click( function() {
        $('.more-less.short').removeClass('active');
        $('.more-less.long').addClass('active');
      });

      $('.more-less .less').click( function() {
        $('.more-less.long').removeClass('active');
        $('.more-less.short').addClass('active');
      });
    }
  };

  /**
   * Adjusts the hieght of the list.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_resource_table_primary = {
    attach: function (context, settings) {
      if ($('#sbac-media-list tbody tr:first-child').length) {
        var row_height = $('#sbac-media-list tbody tr:first-child').height() + 32 + 25 + 67;
        $('.secondary-items-info').css("top",row_height);
      }

      $('.vertical-tabs-list li:nth-child(2) a').click(function () {
        var row_height = $('#sbac-media-list tbody tr:first-child').height() + 32 + 25 + 67;
        $('.secondary-items-info').css("top",row_height);
      });

    }
  };

  /**
   * Controls the buttons at the bottom of the resource form.
   */
  control_form_buttons = function () {
    var cancel_button = $('#edit-cancel');
    var resource_state = Drupal.settings.resource_workbench_current_state;
    var dlrb_member = Drupal.settings.sbac_dlrb_member;
    var submit_resource = $('#sbac-resource-modal-submit-resource');
    var save_all_changes = $('#sbac-resource-save-all-changes');
    var active_tab = $('.vertical-tab-button.selected a strong').html();

    submit_resource.hide();
    cancel_button.hide();
    save_all_changes.hide();
    if (active_tab == 'General' && resource_state == 'creation') {
      cancel_button.show();
    }

    if (active_tab == 'Tags' && dlrb_member == false) {
      $('#edit-save-continue').html('Submit Resource');
    }
    else if (active_tab == 'Advanced') {
      $('#edit-save-continue').html('Save All Changes');
    }
    else {
      $('#edit-save-continue').html('Save and Continue');
    }
  };

  /**
   * Moves the error messages to the correct location when displayed.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_resource_error_message = {
    attach: function (context, settings) {
      // exception to not run this on the main resource pages, as it'll 
      // hide the error messages
      if ($('body').hasClass('node-type-resource')) {
        return;
      }
      
      var alert_box = $('.sbac-resource-alert-box');
      if (alert_box.length) {
        var content = alert_box.html();
        var newdiv = $("<div>");
        newdiv.addClass('sbac-general-alert-box alert-box alert');
        newdiv.html(content);
        $('#submission-general-guidelines').after(newdiv);

        newdiv = $("<div>");
        newdiv.addClass('sbac-summary-alert-box alert-box alert');
        newdiv.html(content);
        $('#submission-summary-guidelines').after(newdiv);

        newdiv = $("<div>");
        newdiv.addClass('sbac-materials-alert-box alert-box alert');
        newdiv.html(content);
        $('#submission-materials-guidelines').after(newdiv);

        newdiv = $("<div>");
        newdiv.addClass('sbac-tags-alert-box alert-box alert');
        newdiv.html(content);
        $('#submission-tags-guidelines').after(newdiv);
        alert_box.remove();
      }
    }
  };

  /**
   * Displays an error message to the user if changes have been made.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_resource_exit_plan = {
    attach: function (context, settings) {
      // don't want to track changes on edit resource tags page
      if ($('#review').length) {
        return;
      }

      $(':input').change( function () {
        if (!isDirty) {
          isDirty = true;
        }
      });

      $(':input[type=text], textarea').keyup( function () {
        if (!isDirty) {
          isDirty = true;
        }
      });

      $(window).bind('beforeunload', function () {
        if (isDirty) {
          return 'You will lose all unsaved changes made to this page.';
        }
      });

      $('.form-submit').click(function () {
        isDirty = false;
      });

      $('#edit-save-continue').mousedown(function () {
        isDirty = false;
      });
    }
  };

  /**
   * Submit resource button click behavior.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.submit_resource = {
    attach: function (context, settings) {
      $('#edit-cancel-overlay').mousedown( function() {
        button_clicked = false;
      });

      var state = Drupal.settings.sbac_resource_valid_state;
      if (state != null && state == true && !button_clicked) {
        submit_resource_click();
        button_clicked = true;
      }
    }
  };

  /**
   * Function to click the resource button.
   */
  submit_resource_click = function () {
    var submit_resource = $('#sbac-resource-modal-submit-resource');
    submit_resource.show();
    submit_resource.click();
    submit_resource.hide();
  };

  /**
   * Controls the click event on the tabs.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.control_click_ability = {
    attach: function (context, settings) {  
      if (Drupal.settings.settings_php && Drupal.settings.settings_php.enable_all_tabs) {
        return;
      }

      if (!Drupal.settings.sbac_summary) {
        $('.vertical-tabs-list li:nth-child(4) a').unbind('click');
        $('.vertical-tabs-list li:nth-child(4) a').addClass('sbac-disabled');
      }
      if (!Drupal.settings.sbac_materials) {
        $('.vertical-tabs-list li:nth-child(3) a').unbind('click');
        $('.vertical-tabs-list li:nth-child(3) a').addClass('sbac-disabled');
      }
      if (!Drupal.settings.sbac_general) {
        $('.vertical-tabs-list li:nth-child(2) a').unbind('click');
        $('.vertical-tabs-list li:nth-child(2) a').addClass('sbac-disabled');
      }
    }
  };

  /**
   * Displays or hides the permissions field.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_resource_permissions = {
    attach: function (context, settings) {
      // States
      if ($('#sbac-permissions-per-state input:radio:first').is(':checked')) {
        $('.form-item-field-view-permissions-per-state-und').hide();
      }
      $('#sbac-permissions-per-state input:radio:first').click(function () {
        $('.form-item-field-view-permissions-per-state-und').hide();
      });
      $('#sbac-permissions-per-state input:radio:last').click(function () {
        $('.form-item-field-view-permissions-per-state-und').show();
      });

      // Resource actions
      $('#edit-field-posting-options-comment').hide();
      if ($('#edit-field-posting-options-und-0').is(':checked')) {
        $('#edit-field-posting-options-comment').show();
      }
      if ($('#edit-field-posting-options-und-1').is(':checked')) {
        $('#edit-field-posting-options-comment').show();
      }
      if ($('#edit-field-posting-options-und-2').is(':checked')) {
        $('#edit-field-posting-options-comment').show();
      }

      $('#edit-field-posting-options-und-0').click(function() {
        $('#edit-field-posting-options-comment').show();
        $('#field-posting-options-comment-add-more-wrapper label').empty().append('To contributor'); // Remove required marker.
        save_all_changes_href($(this).val());
      });
      $('#edit-field-posting-options-und-1').click(function() {
        $('#edit-field-posting-options-comment').show();
        $('#field-posting-options-comment-add-more-wrapper label').empty().append('To contributor'); // Remove required marker.
        save_all_changes_href($(this).val());
      });
      $('#edit-field-posting-options-und-2').click(function() {
        $('#edit-field-posting-options-comment').show();
        $('#field-posting-options-comment-add-more-wrapper label').empty().append('To contributor <span class="form-required" title="This field is required.">*</span>');
        save_all_changes_href($(this).val());
      });
    }
  };

  /**
   * Updates the posting option.
   */
  save_all_changes_href = function (posted_option) {
    var save_all_changes = $('#sbac-resource-save-all-changes');
    var href = $(save_all_changes).attr('href');
    var pos = href.indexOf('posting_option');
    if (pos > -1) {
      var new_href = href.substr(0, pos);
      new_href += 'posting_option=' + posted_option;
      save_all_changes.attr('href', new_href);
    }
  };

  /**
   * Manipulates the license field.
   *
   * @type {{attach: Function}}
   */
  Drupal.behaviors.sbac_resource_license = {
    attach: function (context, settings) {
      // ye who useth field ID selectors to target Drupal's form elements shall
      // be banished to the deepest, darkest pits of shame, and forced to use IE6
      // for a month

      // prepare elements
      var specific_license_text = $('#field_static_license_text');
      var no_license_text = $('#no-license-text');
      var license_url = $('#sbac-resource-license-url');
      var group = $('#license-information-group');
      var user_name = $('#sbac-resource-user-name').children().val();
      var save_continue = $('#edit-save-continue');

      /**
       * Callback to trigger on license option set/change.
       * @param  {[type]} val       Numerical value of chosen option.
       * @param  {[type]} switching Boolena flag to specify whether we're switching 
       *                            an option (true), or setting default (false).
       * @return {[type]}           None.
       */
      var change_option = function(val, switching) {
        if (typeof(switching) == 'undefined') {
          switching = false;
        }

        // start by hiding everything
        specific_license_text.hide();
        no_license_text.hide();
        license_url.hide();

        // make sure we're not looking at a numerical string
        var val = parseInt(val);

        // move the license group to the correct radio option
        group.appendTo($('.license-option-' + val).parent());
        group.show();

        // enable button
        save_continue.removeAttr('disabled');
        save_continue.bind('click');

        // populate the author & publisher fields
        var set_name_fields = function(value) {
          var name_fields = ['.field-name-field-author', '.field-name-field-publisher'];

          $(name_fields).each(function (i, wrapper) {
            var selector = wrapper + ' input[type=text]';

            if ($(selector).val() == '' || switching) {
              $(selector).val(value);
            }
          });
        }

        // clear name fields
        set_name_fields('');

        switch (val) {
          case 0:
            // set user's name
            set_name_fields(user_name);

            // show specific license text
            specific_license_text.show();

            break;

          case 1:
            // show license URL div
            license_url.show();

            break;

          case 2:
            // hide the author/owner group
            group.hide();

            // show no license text
            no_license_text.appendTo($('.license-option-' + val).parent());
            no_license_text.show();

            // disable button
            save_continue.attr('disabled', 'disabled');
            save_continue.unbind('click');

            break;
        }
      };

      // an option is already selected
      var selected_option = $('#sbac-license-information-field :checked');
      if (selected_option.length) {
        change_option(selected_option.val());
      }

      // option is changed
      $('.field-name-field-license-information .form-item input[type=radio]').each(function(i, el) {
        var el = $(el);

        el.click(function(e) {
          change_option(el.val(), true);
        });
      });
    }
  };

})(jQuery);
