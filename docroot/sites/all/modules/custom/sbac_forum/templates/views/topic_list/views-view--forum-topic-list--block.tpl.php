<?php

/**
 * @file
 * Main view template.
 *
 * Variables available:
 * - $classes_array: An array of classes determined in
 *   template_preprocess_views_view(). Default classes are:
 *     .view
 *     .view-[css_name]
 *     .view-id-[view_name]
 *     .view-display-id-[display_name]
 *     .view-dom-id-[dom_id]
 * - $classes: A string version of $classes_array for use in the class attribute
 * - $css_name: A css-safe version of the view name.
 * - $css_class: The user-specified classes names, if any
 * - $header: The view header
 * - $footer: The view footer
 * - $rows: The results of the view query, if any
 * - $empty: The empty text to display if the view is empty
 * - $pager: The pager next/prev links to display, if any
 * - $exposed: Exposed widget form/info to display
 * - $feed_icon: Feed icon to display, if any
 * - $more: A link to view more, if any
 *
 * @ingroup views_templates
 */
?>
<div class="<?php print $classes; ?>">
  <?php print render($title_prefix); ?>
  <?php if ($title): ?>
    <?php print $title; ?>
  <?php endif; ?>
  <?php print render($title_suffix); ?>
  <?php if ($header): ?>
    <div class="view-header">
      <?php print $header; ?>
    </div>
<?php endif; ?>
  <div class="review-it">
<?php
  if ($view->exposed_input['section_id'] == "section-collaboration") {
    $lang = $view->result[0]->_field_data['nid']['entity']->language;
    $tid = $view->result[0]->_field_data['nid']['entity']->field_topic_forum_parent[$lang][0]['tid'];
    print flag_create_link('subscribe_term', $tid);
  }
?>
    <?php if($review): ?>
      <p><?php print $review; ?></p>
      <?php print $rating; ?>
      <?php print $review_count; ?>
    <?php endif; ?>
  </div>
  <?php if ($warning): ?>
    <h2><?php print $warning; ?></h2>
  <?php endif; ?>

  <div class="filter-bar">
    <?php

    // Add join or leave forum buttons
		$path_pieces = explode('/', $_GET['q']);
		$tid = $path_pieces[2];
		$term = taxonomy_term_load($tid);
		$is_member = FALSE;
		foreach($term->field_fc_forum_members['und'] as $member) {
			$member_user = entity_load('field_collection_item', array($member['value']));
			$member_uid = $member_user[$member['value']]->field_fc_forum_member['und'][0]['target_id'];
			if ($user->uid == $member_uid) {
				$is_member = TRUE;
			}
		}
		if ($is_member) {
			ctools_include('modal'); 
			ctools_modal_add_js();

			print '<div class="leave-forum-button-wrapper">';
			print l('Leave Forum', 'sbac-forum/nojs/forum-leave/' . $tid, array(
			 'attributes' => array('class' => 'ctools-use-modal button')));
			print '</div>';
		}
		else {
      module_load_include('inc', 'sbac_forum', 'includes/sbac_forum.forms');
			module_load_include('inc', 'sbac_forum', 'includes/sbac_forum.ajax');
      $join_form = drupal_get_form('sbac_forum_join_button_form', $tid, $user->uid);
			print drupal_render($join_form); 
		}
    ?>
    <?php if ($topic_count): ?>
      <div class="topic-count">
	<?php print $topic_count; ?> Topics:
      </div>
    <?php endif; ?>

    <?php if ($exposed): ?>
      <div class="view-filters">
	<?php print $exposed; ?>
      </div>
    <?php endif; ?>

    <?php if(isset($participants)): ?>
      <div class="participants-count">
	<?php print $participants; ?>
      </div>
    <?php endif; ?>

    <?php if ($join_button): ?>
      <div id="join-forum-form-wrapper">
	<?php print $join_button; ?>
      </div>
    <?php endif; ?>
  </div>

  <?php if ($attachment_before): ?>
    <div class="attachment attachment-before">
      <?php print $attachment_before; ?>
    </div>
  <?php endif; ?>

  <?php if ($rows): ?>
    <div class="view-content">
      <?php print $rows; ?>
    </div>
    <?php elseif ($empty): ?>
      <div class="view-empty">
	<?php print $empty; ?>
      </div>
    <?php endif; ?>

    <?php if ($pager): ?>
      <?php print $pager; ?>
    <?php endif; ?>

    <?php if ($attachment_after): ?>
      <div class="attachment attachment-after">
	<?php print $attachment_after; ?>
      </div>
    <?php endif; ?>

    <?php if ($more): ?>
      <?php print $more; ?>
    <?php endif; ?>

    <?php if ($footer): ?>
      <div class="view-footer">
	<?php print $footer; ?>
      </div>
    <?php endif; ?>

    <?php if ($feed_icon): ?>
      <div class="feed-icon">
	<?php print $feed_icon; ?>
      </div>
    <?php endif; ?>

</div><?php /* class view */ ?>
