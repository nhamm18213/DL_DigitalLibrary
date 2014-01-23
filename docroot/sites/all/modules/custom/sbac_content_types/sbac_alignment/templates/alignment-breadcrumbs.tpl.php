<?php
  $last_term = end($terms);
  $additional_class = '';
?>
<div class="breadcrumb">
  <ul class="inline-list">
    <?php if (is_array($terms)): ?>
      <?php foreach ($terms as $term): ?>
        <li id="term-<?php print $term->tid; ?>">
          <?php if ($last_term == $term) {
            $additional_class = 'sbac-custom-term-remove-last-crumb';
          }?>
          <a href="#" tid="<?php print $term->tid; ?>" class="sbac-custom-term-remove <?php print $additional_class; ?>">
            <span class="b-label">
              <?php ($shortname = $term->field_alignment_shortname['und'][0]['value'])? print $shortname: print $term->name; ?>&nbsp;&nbsp;&nbsp;|&nbsp; x</span><span class="arrow"><span></span></span>
          </a>
        </li>
      <?php endforeach; ?>
    <?php endif; ?>
  </ul>
</div>
