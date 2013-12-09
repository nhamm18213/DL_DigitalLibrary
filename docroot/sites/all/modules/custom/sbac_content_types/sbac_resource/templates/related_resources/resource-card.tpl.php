<div class='resource-card'>
  <div class="resource-top">
    <?php
    $class = '';
    $text = '';
    $image = '';
    if (isset($fields['sticky']) && $fields['sticky']->raw == 1) {
      $class = 'distinction';
      $text = 'Posted with Distinction';
      $image =  '<a href="#" data-dropdown="distinction-drop-'. $fields['nid']->raw.'"><img src="/sites/all/themes/SBAC/images/icons/icon-shield.png" alt="Posted With Distinction Logo"></a>
          <ul id="distinction-drop-'. $fields['nid']->raw.'" class="f-dropdown" data-dropdown-content>
            <li>Posted with Distinction</li>
          </ul>';
    }
    ?>

    <h3 class='resource-name <?php print $class; ?>'>
      <?php print htmlspecialchars_decode($fields['title']->content); ?>
      <div class="shield-drop"><?php print $image; ?></div>
    </h3>

    <?php if (isset($fields['image'])): ?>
      <?php print $fields['image']; ?>
      <?php print '<span class="' . $fields['file-type-icon'] . '"></span>'; ?>
    <?php endif; ?>

    <div class='resource-stats'>
      <p>
        <?php (isset($fields['field_alt_body']) ? print $fields['field_alt_body']->content : print ''); ?>
      </p>
    </div>
  </div>

  <?php
  $class = '';
  if ($fields['state']->raw == 'published') {
    $class = ' approved ';
  }
  ?>

  <div class="clearfix resoruce-bottom <?php print $class; ?> <?php (isset($fields['text']) ? print  strtolower(str_replace(' ', '-', $fields['text'])) : ''); ?>">
    <?php if (isset($fields['text']) && $fields['text'] != 'approved'): ?>
      <div class="resource-state-description">
        <p>
          <?php print $fields['text'] ?>
        </p>
      </div>
      <?php
      if (isset($fields['buttons']) && is_array($fields['buttons'])) {
        foreach ($fields['buttons'] as $type => $button) {
          print '<div class="resource-button left">';
          print $button;
          print '</div>';
        }
      }
      ?>
    <?php endif; ?>


    <?php if (isset($fields['views']) || isset($fields['downloads']) || isset($fields['collaborators'])): ?>

      <div class="paradata-numbers">
        <?php if (isset($fields['views']) && $fields['views']): ?>
          <?php print $fields['views'] . ','; ?>
        <?php endif; ?>

        <?php if (isset($fields['downloads']) && $fields['downloads']): ?>
          <?php print $fields['downloads']; ?>
        <?php endif; ?>

        <?php if (isset($fields['collaborators']) && $fields['collaborators']): ?>
          <?php // print $fields['collaborators']; ?>
        <?php endif; ?>
      </div>

    <?php endif; ?>

    <?php if (isset($fields['subject']) || isset($fields['grades']) || isset($fields['media_types'])): ?>
      <div class="paradata-info">
        <?php if (isset($fields['subject']) && $fields['subject']): ?>
          <label class="clearfix">Subjects:</label><?php print $fields['subject']; ?>
        <?php endif; ?>

        <?php if (isset($fields['grades']) && $fields['grades']): ?>
          <label class="clearfix">Grades:</label><?php print $fields['grades']; ?>
        <?php endif; ?>

        <?php if (isset($fields['media_types']) && $fields['media_types']): ?>
          <label class="clearfix">Media Types:</label><?php print $fields['media_types']; ?>
        <?php endif; ?>
      </div>
    <?php endif; ?>

    <?php
    if (isset($fields['buttons']) && is_array($fields['buttons'])) {
      foreach ($fields['buttons'] as $type => $button) {
        print '<div class="resource-button left">';
        print $button;
        print '</div>';
      }
    }
    ?>

  </div>
</div>
