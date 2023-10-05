<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class GameController extends AbstractController
{
    #[Route('/', name: 'app_index')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to BeerPongCup !',
        ]);
    }
}
