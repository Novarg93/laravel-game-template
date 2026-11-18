<?php

namespace App\Console\Commands;

use App\Support\ProjectPresentation;
use Illuminate\Console\Command;
use InvalidArgumentException;

final class ProjectPresentationCommand extends Command
{
    protected $signature = 'project:sync {--check : Validate and compare without writing} {--configured : Include local deployment overrides in the standalone export}';

    protected $description = 'Validate project branding and synchronize the standalone presentation';

    public function handle(ProjectPresentation $project): int
    {
        try {
            $project->website(strict: true);
            $project->admin(strict: true);
            $game = $project->game(defaults: ! $this->option('configured'), strict: true);
        } catch (InvalidArgumentException $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }

        $path = base_path('game/presentation.generated.json');
        $json = json_encode($game, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n";
        if ($this->option('check')) {
            if (! is_file($path) || file_get_contents($path) !== $json) {
                $this->error('Standalone project presentation is stale. Run php artisan project:sync with the same options, omitting --check.');

                return self::FAILURE;
            }
        } elseif (file_put_contents($path, $json) === false) {
            $this->error('Could not write the standalone presentation.');

            return self::FAILURE;
        }

        $this->info('Project configuration and standalone presentation are valid.');

        return self::SUCCESS;
    }
}
