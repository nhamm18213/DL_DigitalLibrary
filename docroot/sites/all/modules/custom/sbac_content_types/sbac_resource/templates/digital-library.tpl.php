<div class='row digital-library'>
  <?php if ($no_results) : ?>
  <div class="no-results">
    <?php echo $no_results; ?>
    <a href="/digital-library-resources" class="button">Browse All Resources</a>
  </div>
  <?php endif; ?>
  <div class='column large-12'>
      <?php print $resource_layout_view; ?>
  </div>
</div>
